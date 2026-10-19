import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Carrito, NuevaReserva, Prenda, Reserva } from '../dominio/entidades';
import { CarritoRepository } from '../dominio/carrito.repository';
import { PrismaService } from '../../prisma/prisma.service';

const conDetalles = {
  detalles: { include: { variante: { include: { producto: true } } } },
} satisfies Prisma.PedidoInclude;

type PedidoConDetalles = Prisma.PedidoGetPayload<{
  include: typeof conDetalles;
}>;

function aCarrito(pedido: PedidoConDetalles): Carrito {
  return {
    idPedido: pedido.idPedido,
    idCliente: pedido.idCliente,
    subtotal: Number(pedido.subtotal),
    detalles: pedido.detalles.map((d) => ({
      idDetallePedido: d.idDetallePedido,
      idVariante: d.idVariante,
      nombre: d.variante.producto.nombre,
      talla: d.variante.talla,
      color: d.variante.color,
      cantidad: d.cantidad,
      precioUnitario: Number(d.precioUnitario),
      stock: d.variante.stock,
    })),
  };
}

@Injectable()
export class CarritoPrismaRepository implements CarritoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarCarrito(idCliente: number): Promise<Carrito | null> {
    const pedido = await this.prisma.pedido.findFirst({
      where: { idCliente, estadoPedido: 'EN_CARRITO' },
      include: conDetalles,
    });
    return pedido ? aCarrito(pedido) : null;
  }

  async crearCarrito(idCliente: number): Promise<Carrito> {
    const pedido = await this.prisma.pedido.create({
      data: { idCliente },
      include: conDetalles,
    });
    return aCarrito(pedido);
  }

  async buscarPrenda(idVariante: number): Promise<Prenda | null> {
    const variante = await this.prisma.varianteProducto.findUnique({
      where: { idVariante },
      include: { producto: true },
    });
    if (!variante) return null;
    return {
      idVariante: variante.idVariante,
      nombre: variante.producto.nombre,
      talla: variante.talla,
      color: variante.color,
      precio: Number(variante.producto.precio),
      stock: variante.stock,
    };
  }

  async agregarDetalle(
    idPedido: number,
    idVariante: number,
    cantidad: number,
    precioUnitario: number,
  ): Promise<void> {
    await this.prisma.detallePedido.create({
      data: { idPedido, idVariante, cantidad, precioUnitario },
    });
  }

  async cambiarCantidad(
    idDetallePedido: number,
    cantidad: number,
  ): Promise<void> {
    await this.prisma.detallePedido.update({
      where: { idDetallePedido },
      data: { cantidad },
    });
  }

  async eliminarDetalle(idDetallePedido: number): Promise<void> {
    await this.prisma.detallePedido.delete({ where: { idDetallePedido } });
  }

  async guardarSubtotal(idPedido: number, subtotal: number): Promise<void> {
    await this.prisma.pedido.update({
      where: { idPedido },
      data: { subtotal },
    });
  }

  async reservadoPorOtros(
    idVariante: number,
    idPedido: number,
    ahora: Date,
  ): Promise<number> {
    const suma = await this.prisma.reserva.aggregate({
      _sum: { cantidad: true },
      where: {
        idVariante,
        idPedido: { not: idPedido },
        expiraEn: { gt: ahora },
      },
    });
    return suma._sum.cantidad ?? 0;
  }

  async buscarReservas(idPedido: number, ahora: Date): Promise<Reserva[]> {
    return this.prisma.reserva.findMany({
      where: { idPedido, expiraEn: { gt: ahora } },
      select: { idVariante: true, cantidad: true, expiraEn: true },
    });
  }

  async reservar(
    idPedido: number,
    reservas: NuevaReserva[],
    expiraEn: Date,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.reserva.deleteMany({ where: { idPedido } }),
      this.prisma.reserva.createMany({
        data: reservas.map((r) => ({ ...r, idPedido, expiraEn })),
      }),
    ]);
  }

  async liberarReservas(idPedido: number): Promise<void> {
    await this.prisma.reserva.deleteMany({ where: { idPedido } });
  }
}
