import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Confirmacion, Pedido, Reserva } from '../dominio/entidades';
import { PedidoRepository } from '../dominio/pedido.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { crearPago } from '../../pagos/infra/crear-pago';

const conDetalles = {
  detalles: { include: { variante: { include: { producto: true } } } },
} satisfies Prisma.PedidoInclude;

type PedidoConDetalles = Prisma.PedidoGetPayload<{
  include: typeof conDetalles;
}>;

function aPedido(pedido: PedidoConDetalles): Pedido {
  return {
    idPedido: pedido.idPedido,
    idCliente: pedido.idCliente,
    numPedido: pedido.numPedido,
    fecha: pedido.fecha,
    subtotal: Number(pedido.subtotal),
    total: Number(pedido.total),
    estadoPedido: pedido.estadoPedido,
    metodoEntrega: pedido.metodoEntrega,
    fechaLimitePago: pedido.fechaLimitePago,
    detalles: pedido.detalles.map((d) => ({
      idDetallePedido: d.idDetallePedido,
      idVariante: d.idVariante,
      nombre: d.variante.producto.nombre,
      talla: d.variante.talla,
      color: d.variante.color,
      cantidad: d.cantidad,
      precioUnitario: Number(d.precioUnitario),
    })),
  };
}

@Injectable()
export class PedidoPrismaRepository implements PedidoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarCarrito(idCliente: number): Promise<Pedido | null> {
    const pedido = await this.prisma.pedido.findFirst({
      where: { idCliente, estadoPedido: 'EN_CARRITO' },
      include: conDetalles,
    });
    return pedido ? aPedido(pedido) : null;
  }

  async buscarPorId(idPedido: number): Promise<Pedido | null> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { idPedido },
      include: conDetalles,
    });
    return pedido ? aPedido(pedido) : null;
  }

  async listarPorCliente(idCliente: number): Promise<Pedido[]> {
    const pedidos = await this.prisma.pedido.findMany({
      where: { idCliente, estadoPedido: { not: 'EN_CARRITO' } },
      orderBy: { idPedido: 'desc' },
      include: conDetalles,
    });
    return pedidos.map(aPedido);
  }

  async buscarReservas(idPedido: number, ahora: Date): Promise<Reserva[]> {
    return this.prisma.reserva.findMany({
      where: { idPedido, expiraEn: { gt: ahora } },
      select: { idVariante: true, cantidad: true },
    });
  }

  async liberarReservas(idPedido: number): Promise<void> {
    await this.prisma.reserva.deleteMany({ where: { idPedido } });
  }

  // Todo en una transaccion: si algo falla no se descuenta stock
  // ni se queda un pedido a medias.
  async confirmar(datos: Confirmacion): Promise<Pedido> {
    const pedido = await this.prisma.$transaction(async (tx) => {
      const detalles = await tx.detallePedido.findMany({
        where: { idPedido: datos.idPedido },
      });

      // La reserva se vuelve descuento firme de inventario.
      for (const d of detalles) {
        await tx.varianteProducto.update({
          where: { idVariante: d.idVariante },
          data: { stock: { decrement: d.cantidad } },
        });
      }
      await tx.reserva.deleteMany({ where: { idPedido: datos.idPedido } });

      if (datos.envio) {
        await tx.envio.create({
          data: {
            idPedido: datos.idPedido,
            idDireccion: datos.envio.idDireccion,
            costoEnvio: datos.envio.costoEnvio,
          },
        });
      }

      await crearPago(tx, datos.idPedido, datos.formaPago, datos.total);

      return tx.pedido.update({
        where: { idPedido: datos.idPedido },
        data: {
          numPedido: datos.numPedido,
          metodoEntrega: datos.metodoEntrega,
          total: datos.total,
          fechaLimitePago: datos.fechaLimitePago,
          estadoPedido: 'PENDIENTE_DE_PAGO',
        },
        include: conDetalles,
      });
    });
    return aPedido(pedido);
  }

  async buscarVencidos(ahora: Date): Promise<Pedido[]> {
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        estadoPedido: 'PENDIENTE_DE_PAGO',
        fechaLimitePago: { lt: ahora },
      },
      include: conDetalles,
    });
    return pedidos.map(aPedido);
  }

  // 2.2.10: se cancela el pedido y las unidades regresan al inventario.
  async cancelar(idPedido: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const detalles = await tx.detallePedido.findMany({ where: { idPedido } });
      for (const d of detalles) {
        await tx.varianteProducto.update({
          where: { idVariante: d.idVariante },
          data: { stock: { increment: d.cantidad } },
        });
      }
      await tx.pago.updateMany({
        where: { idPedido, estadoPago: 'PENDIENTE' },
        data: { estadoPago: 'CANCELADO' },
      });
      await tx.pedido.update({
        where: { idPedido },
        data: { estadoPedido: 'CANCELADO' },
      });
    });
  }
}
