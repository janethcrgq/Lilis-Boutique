import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatosTarjeta, FormaPago, Pago, ResumenDelPedido } from '../dominio/entidades';
import { PagoRepository } from '../dominio/pago.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { crearPago } from './crear-pago';

const completo = {
  pedido: true,
  pagoTransferencia: true,
  pagoContraEntrega: true,
} satisfies Prisma.PagoInclude;

type PagoCompleto = Prisma.PagoGetPayload<{ include: typeof completo }>;

const paraResumen = {
  cliente: { include: { usuario: true } },
  envio: { include: { direccion: { include: { zona: true } } } },
  detalles: {
    include: {
      variante: { include: { producto: { include: { categoria: true } } } },
    },
  },
} satisfies Prisma.PedidoInclude;

type PedidoParaResumen = Prisma.PedidoGetPayload<{
  include: typeof paraResumen;
}>;

function aPago(pago: PagoCompleto): Pago {
  return {
    idPago: pago.idPago,
    idPedido: pago.idPedido,
    idCliente: pago.pedido.idCliente,
    numPedido: pago.pedido.numPedido,
    estadoPedido: pago.pedido.estadoPedido,
    metodoEntrega: pago.pedido.metodoEntrega,
    monto: Number(pago.monto),
    fecha: pago.fecha,
    estadoPago: pago.estadoPago,
    metodo: pago.metodo,
    folio: pago.pagoContraEntrega?.folio ?? null,
    numeroReferencia: pago.pagoTransferencia?.numeroReferencia ?? null,
    comprobanteURL: pago.pagoTransferencia?.comprobanteURL ?? null,
  };
}

function aResumen(pedido: PedidoParaResumen): ResumenDelPedido {
  const direccion = pedido.envio?.direccion;
  return {
    idPedido: pedido.idPedido,
    idCliente: pedido.idCliente,
    numPedido: pedido.numPedido,
    estadoPedido: pedido.estadoPedido,
    fecha: pedido.fecha,
    fechaLimitePago: pedido.fechaLimitePago,
    subtotal: Number(pedido.subtotal),
    total: Number(pedido.total),
    metodoEntrega: pedido.metodoEntrega,
    costoEnvio: pedido.envio ? Number(pedido.envio.costoEnvio) : 0,
    zona: direccion?.zona.nombre ?? null,
    direccion: direccion
      ? `${direccion.calle} ${direccion.numeroCasa}, Col. ${direccion.colonia}`
      : null,
    nombreClienta: pedido.cliente.usuario.nombre,
    correoClienta: pedido.cliente.usuario.correo,
    prendas: pedido.detalles.map((d) => ({
      nombre: d.variante.producto.nombre,
      categoria: d.variante.producto.categoria.nombre,
      talla: d.variante.talla,
      color: d.variante.color,
      cantidad: d.cantidad,
      precioUnitario: Number(d.precioUnitario),
      imagenURL: d.variante.imagenURL,
    })),
  };
}

@Injectable()
export class PagoPrismaRepository implements PagoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(idPago: number): Promise<Pago | null> {
    const pago = await this.prisma.pago.findUnique({
      where: { idPago },
      include: completo,
    });
    return pago ? aPago(pago) : null;
  }

  async buscarPendiente(idPedido: number): Promise<Pago | null> {
    const pago = await this.prisma.pago.findFirst({
      where: { idPedido, estadoPago: 'PENDIENTE' },
      orderBy: { idPago: 'desc' },
      include: completo,
    });
    return pago ? aPago(pago) : null;
  }

  async buscarPorFolio(folio: string): Promise<Pago | null> {
    const contraEntrega = await this.prisma.pagoContraEntrega.findUnique({
      where: { folio },
    });
    return contraEntrega ? this.buscarPorId(contraEntrega.idPago) : null;
  }

  async listarTransferenciasPendientes(): Promise<Pago[]> {
    const pagos = await this.prisma.pago.findMany({
      where: {
        metodo: 'TRANSFERENCIA',
        estadoPago: 'PENDIENTE',
        pagoTransferencia: { is: { comprobanteURL: { not: null } } },
      },
      orderBy: { idPago: 'asc' },
      include: completo,
    });
    return pagos.map(aPago);
  }

  async buscarUltimo(idPedido: number): Promise<Pago | null> {
    const pago = await this.prisma.pago.findFirst({
      where: { idPedido },
      orderBy: { idPago: 'desc' },
      include: completo,
    });
    return pago ? aPago(pago) : null;
  }

  async buscarResumen(idPedido: number): Promise<ResumenDelPedido | null> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { idPedido },
      include: paraResumen,
    });
    return pedido ? aResumen(pedido) : null;
  }

  

  async crear(
    idPedido: number,
    metodo: FormaPago,
    monto: number,
  ): Promise<Pago> {
    const idPago = await this.prisma.$transaction((tx) =>
      crearPago(tx, idPedido, metodo, monto),
    );
    return this.obtener(idPago);
  }

  async aprobar(idPago: number, tarjeta?: DatosTarjeta): Promise<Pago> {
    await this.prisma.$transaction(async (tx) => {
      if (tarjeta) {
        await tx.pagoTarjeta.update({ where: { idPago }, data: tarjeta });
      }
      const pago = await tx.pago.update({
        where: { idPago },
        data: { estadoPago: 'APROBADO' },
      });
      await tx.pedido.update({
        where: { idPedido: pago.idPedido },
        data: { estadoPedido: 'PAGADO' },
      });
    });
    return this.obtener(idPago);
  }

  async rechazar(idPago: number, tarjeta: DatosTarjeta): Promise<Pago> {
    await this.prisma.$transaction([
      this.prisma.pagoTarjeta.update({ where: { idPago }, data: tarjeta }),
      this.prisma.pago.update({
        where: { idPago },
        data: { estadoPago: 'RECHAZADO' },
      }),
    ]);
    return this.obtener(idPago);
  }

  async cancelar(idPago: number): Promise<void> {
    await this.prisma.pago.update({
      where: { idPago },
      data: { estadoPago: 'CANCELADO' },
    });
  }

  async registrarComprobante(
    idPago: number,
    numeroReferencia: string,
    comprobanteURL: string,
  ): Promise<Pago> {
    await this.prisma.pagoTransferencia.update({
      where: { idPago },
      data: { numeroReferencia, comprobanteURL },
    });
    return this.obtener(idPago);
  }

  private async obtener(idPago: number): Promise<Pago> {
    const pago = await this.prisma.pago.findUniqueOrThrow({
      where: { idPago },
      include: completo,
    });
    return aPago(pago);
  }
}
