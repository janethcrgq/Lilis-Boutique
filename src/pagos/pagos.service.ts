import { Inject, Injectable } from '@nestjs/common';
import type {
  DatosTarjeta,
  InstruccionesDePago,
  Pago,
  ResultadoPasarela,
  EstadoDelPago
} from './dominio/entidades';
import type { PagoRepository } from './dominio/pago.repository';
import type { PasarelaPagos } from './dominio/pasarela-pagos';
import {
  ContraEntregaNoPermitidaError,
  OtroMetodoDePagoError,
  PagoNoEncontradoError,
  PagoRechazadoError,
  PasarelaNoDisponibleError,
  PedidoNoEncontradoError,
  SinComprobanteError,
} from './dominio/errores';
import { CambiarFormaPagoDto } from './dto/cambiar-forma-pago.dto';
import { PagarTarjetaDto } from './dto/pagar-tarjeta.dto';
import { SubirComprobanteDto } from './dto/subir-comprobante.dto';
import { PAGO_REPOSITORY, PASARELA_PAGOS } from './pagos.tokens';
import type { Notificador } from '../notificaciones/dominio/notificador';
import { NOTIFICADOR } from '../notificaciones/notificaciones.tokens';


function normalizarFolio(folio: string): string {
  return folio.trim().toUpperCase();
}

@Injectable()
export class PagosService {
  constructor(
    @Inject(PAGO_REPOSITORY)
    private readonly repo: PagoRepository,
    @Inject(PASARELA_PAGOS)
    private readonly pasarela: PasarelaPagos,
    @Inject(NOTIFICADOR)
    private readonly notificador: Notificador,
  ) {}

  async instruccionesDePedido(idPedido: number): Promise<InstruccionesDePago> {
    const pago = await this.repo.buscarPendiente(idPedido);
    if (!pago) {
      throw new PagoNoEncontradoError();
    }
    return this.instrucciones(pago);
  }


  async estadoDelPago(
    idCliente: number,
    idPedido: number,
  ): Promise<EstadoDelPago> {
    const resumen = await this.repo.buscarResumen(idPedido);
    if (
      !resumen ||
      resumen.idCliente !== idCliente ||
      resumen.estadoPedido === 'EN_CARRITO'
    ) {
      throw new PedidoNoEncontradoError();
    }

    const pago = await this.repo.buscarUltimo(idPedido);
    const esperaPago =
      pago?.estadoPago === 'PENDIENTE' &&
      resumen.estadoPedido === 'PENDIENTE_DE_PAGO';

    return {
      ...resumen,
      pago,
      instrucciones: pago && esperaPago ? this.instrucciones(pago) : null,
    };
  }

  // Paso 19-21 del CU (y 2.2.5 / 2.2.7 cuando algo sale mal).
  async pagarConTarjeta(
    idCliente: number,
    idPedido: number,
    dto: PagarTarjetaDto,
  ): Promise<Pago> {
    const pago = await this.pendienteDe(idCliente, idPedido);
    if (pago.metodo !== 'TARJETA') {
      throw new OtroMetodoDePagoError(pago.metodo);
    }

    let resultado: ResultadoPasarela;
    try {
      resultado = await this.pasarela.cobrar(pago.monto, dto.tokenTarjeta);
    } catch {
      // 2.2.7: el pedido se queda en PENDIENTE_DE_PAGO para reintentar.
      throw new PasarelaNoDisponibleError();
    }

    const tarjeta = {
      idTransaccion: resultado.idTransaccion,
      respuestaPasarela: resultado.respuesta,
    };

    if (!resultado.aprobado) {
      // 2.2.5: se guarda el rechazo y queda un pago nuevo pendiente,
      // asi la clienta puede reintentar sin volver a descontar stock.
      await this.repo.rechazar(pago.idPago, tarjeta);
      await this.repo.crear(pago.idPedido, 'TARJETA', pago.monto);
      throw new PagoRechazadoError();
    }

    return this.aprobar(pago, tarjeta);
  }

  // 2.2.5 / 2.2.7: elegir otro metodo de pago (regresa al paso 14).
  async cambiarFormaPago(
    idCliente: number,
    idPedido: number,
    dto: CambiarFormaPagoDto,
  ): Promise<InstruccionesDePago> {
    const pago = await this.pendienteDe(idCliente, idPedido);

    // REGLA: contra entrega solo si la clienta recoge en boutique.
    if (
      dto.formaPago === 'CONTRA_ENTREGA' &&
      pago.metodoEntrega !== 'RECOGER_EN_BOUTIQUE'
    ) {
      throw new ContraEntregaNoPermitidaError();
    }

    await this.repo.cancelar(pago.idPago);
    const nuevo = await this.repo.crear(
      pago.idPedido,
      dto.formaPago,
      pago.monto,
    );
    return this.instrucciones(nuevo);
  }

  // 2.2.3 pasos 5-6: la clienta captura la referencia y sube el comprobante.
  async subirComprobante(
    idCliente: number,
    idPedido: number,
    dto: SubirComprobanteDto,
  ): Promise<Pago> {
    const pago = await this.pendienteDe(idCliente, idPedido);
    if (pago.metodo !== 'TRANSFERENCIA') {
      throw new OtroMetodoDePagoError(pago.metodo);
    }
    return this.repo.registrarComprobante(
      pago.idPago,
      dto.numeroReferencia,
      dto.comprobanteURL,
    );
  }

  // Lo hace la Duena despues del CU: revisa el comprobante y aprueba.
  async aprobarTransferencia(idPago: number): Promise<Pago> {
    const pago = await this.repo.buscarPorId(idPago);
    if (
      !pago ||
      pago.metodo !== 'TRANSFERENCIA' ||
      pago.estadoPago !== 'PENDIENTE'
    ) {
      throw new PagoNoEncontradoError();
    }
    if (!pago.comprobanteURL) {
      throw new SinComprobanteError();
    }
    return this.aprobar(pago);
  }


  listarTransferenciasPendientes(): Promise<Pago[]> {
    return this.repo.listarTransferenciasPendientes();
  }


  async buscarPorFolio(folio: string): Promise<Pago> {
    const pago = await this.repo.buscarPorFolio(normalizarFolio(folio));
    if (!pago || pago.estadoPago !== 'PENDIENTE') {
      throw new PagoNoEncontradoError();
    }
    return pago;
  }

  // Lo hace la Vendedora cuando la clienta paga al recoger (2.2.4 paso 6).
  async cobrarEnBoutique(folio: string): Promise<Pago> {
    const pago = await this.buscarPorFolio(folio);
    return this.aprobar(pago);
  }

  // El pago pasa a APROBADO, el pedido a PAGADO y se avisa a la clienta.
  private async aprobar(pago: Pago, tarjeta?: DatosTarjeta): Promise<Pago> {
    const aprobado = await this.repo.aprobar(pago.idPago, tarjeta);
    await this.notificador.pagoAprobado(
      aprobado.idCliente,
      aprobado.numPedido ?? '',
      aprobado.monto,
    );
    return aprobado;
  }

  private async pendienteDe(
    idCliente: number,
    idPedido: number,
  ): Promise<Pago> {
    const pago = await this.repo.buscarPendiente(idPedido);
    if (
      !pago ||
      pago.idCliente !== idCliente ||
      pago.estadoPedido !== 'PENDIENTE_DE_PAGO'
    ) {
      throw new PagoNoEncontradoError();
    }
    return pago;
  }

  private instrucciones(pago: Pago): InstruccionesDePago {
    const base = {
      idPago: pago.idPago,
      metodo: pago.metodo,
      monto: pago.monto,
    };

    if (pago.metodo === 'TRANSFERENCIA') {
      return {
        ...base,
        banco: process.env.BANCO_BOUTIQUE ?? '',
        clabe: process.env.CLABE_BOUTIQUE ?? '',
        concepto: pago.numPedido ?? '',
        mensaje:
          'Haz la transferencia y sube tu comprobante con el numero de referencia',
      };
    }
    if (pago.metodo === 'CONTRA_ENTREGA') {
      return {
        ...base,
        folio: pago.folio ?? '',
        mensaje: 'Muestra este folio en la boutique al recoger tu pedido',
      };
    }
    return {
      ...base,
      mensaje: 'Ingresa los datos de tu tarjeta en la pasarela',
    };
  }
}
