import { Inject, Injectable } from '@nestjs/common';
import type { Pedido } from './dominio/entidades';
import type { PedidoRepository } from './dominio/pedido.repository';
import {
  CarritoVacioError,
  PedidoNoEncontradoError,
  ReservaVencidaError,
} from './dominio/errores';
import { ConfirmarPedidoDto } from './dto/confirmar-pedido.dto';
import { EnviosService } from '../envios/envios.service';
import { PagosService } from '../pagos/pagos.service';
import { ContraEntregaNoPermitidaError } from '../pagos/dominio/errores';
import type { InstruccionesDePago } from '../pagos/dominio/entidades';
import type { Notificador } from '../notificaciones/dominio/notificador';
import { NOTIFICADOR } from '../notificaciones/notificaciones.tokens';
import { PEDIDO_REPOSITORY } from './pedidos.tokens';

// El CU no define la fecha limite de pago; por ahora 48 horas.
const HORAS_LIMITE_PAGO = 48;

@Injectable()
export class PedidosService {
  constructor(
    @Inject(PEDIDO_REPOSITORY)
    private readonly repo: PedidoRepository,
    private readonly enviosService: EnviosService,
    private readonly pagosService: PagosService,
    @Inject(NOTIFICADOR)
    private readonly notificador: Notificador,
  ) {}

  async buscar(idCliente: number, idPedido: number): Promise<Pedido> {
    const pedido = await this.repo.buscarPorId(idPedido);
    if (!pedido || pedido.idCliente !== idCliente) {
      throw new PedidoNoEncontradoError(idPedido);
    }
    return pedido;
  }

  // Pasos 17-18 del CU: "Confirmar pedido".
  async confirmar(
    idCliente: number,
    dto: ConfirmarPedidoDto,
  ): Promise<{ pedido: Pedido; pago: InstruccionesDePago }> {
    const carrito = await this.repo.buscarCarrito(idCliente);
    if (!carrito || carrito.detalles.length === 0) {
      throw new CarritoVacioError();
    }

    // REGLA 1: contra entrega solo si la clienta recoge en boutique.
    if (
      dto.formaPago === 'CONTRA_ENTREGA' &&
      dto.metodoEntrega !== 'RECOGER_EN_BOUTIQUE'
    ) {
      throw new ContraEntregaNoPermitidaError();
    }

    // REGLA 2 (2.2.9): la reserva de 15 minutos tiene que seguir vigente
    // y cubrir todas las prendas. Si vencio se libera y se vuelve al paso 6.
    const reservas = await this.repo.buscarReservas(
      carrito.idPedido,
      new Date(),
    );
    const cubre = carrito.detalles.every((d) =>
      reservas.some(
        (r) => r.idVariante === d.idVariante && r.cantidad >= d.cantidad,
      ),
    );
    if (!cubre) {
      await this.repo.liberarReservas(carrito.idPedido);
      throw new ReservaVencidaError();
    }

    const costoEnvio = await this.enviosService.calcularCosto(
      idCliente,
      dto.metodoEntrega,
      dto.idDireccion,
    );

    const pedido = await this.repo.confirmar({
      idPedido: carrito.idPedido,
      numPedido: `LB-${String(carrito.idPedido).padStart(6, '0')}`,
      metodoEntrega: dto.metodoEntrega,
      total: Math.round((carrito.subtotal + costoEnvio) * 100) / 100,
      fechaLimitePago: new Date(
        Date.now() + HORAS_LIMITE_PAGO * 60 * 60 * 1000,
      ),
      formaPago: dto.formaPago,
      // REGLA 3: recoger en boutique no crea Envio.
      envio:
        dto.metodoEntrega === 'DOMICILIO' && dto.idDireccion
          ? { idDireccion: dto.idDireccion, costoEnvio }
          : null,
    });

    const pago = await this.pagosService.instruccionesDePedido(pedido.idPedido);
    const numPedido = pedido.numPedido ?? '';

    // Aviso a la boutique y, si no paga con tarjeta, el comprobante
    // preliminar a la clienta (2.2.3 paso 4 y 2.2.4 paso 5).
    await this.notificador.nuevoPedido(
      numPedido,
      pedido.total,
      dto.metodoEntrega,
    );
    if (pago.metodo !== 'TARJETA') {
      await this.notificador.comprobantePreliminar(
        idCliente,
        numPedido,
        pedido.total,
        pago.mensaje,
      );
    }

    return { pedido, pago };
  }

  // 2.2.10: los pedidos que pasan su fecha limite sin pago se cancelan.
  async cancelarVencidos(): Promise<number> {
    const vencidos = await this.repo.buscarVencidos(new Date());
    for (const pedido of vencidos) {
      await this.repo.cancelar(pedido.idPedido);
      await this.notificador.pedidoCancelado(
        pedido.idCliente,
        pedido.numPedido ?? '',
      );
    }
    return vencidos.length;
  }
}
