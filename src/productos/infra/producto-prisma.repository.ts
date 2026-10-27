import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Producto } from '../dominio/entidades';
import { ProductoRepository } from '../dominio/producto.repository';
import { PrismaService } from '../../prisma/prisma.service';

function conVariantes(ahora: Date) {
  return {
    categoria: true,
    variantes: {
      include: { reservas: { where: { expiraEn: { gt: ahora } } } },
      orderBy: { idVariante: 'asc' },
    },
  } satisfies Prisma.ProductoInclude;
}

type ProductoConVariantes = Prisma.ProductoGetPayload<{
  include: ReturnType<typeof conVariantes>;
}>;

function aProducto(producto: ProductoConVariantes): Producto {
  return {
    idProducto: producto.idProducto,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: Number(producto.precio),
    categoria: producto.categoria.nombre,
    variantes: producto.variantes.map((v) => {
      const apartadas = v.reservas.reduce((suma, r) => suma + r.cantidad, 0);
      return {
        idVariante: v.idVariante,
        talla: v.talla,
        color: v.color,
        imagenURL: v.imagenURL,
        disponibles: Math.max(v.stock - apartadas, 0),
      };
    }),
  };
}

@Injectable()
export class ProductoPrismaRepository implements ProductoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listar(ahora: Date): Promise<Producto[]> {
    const productos = await this.prisma.producto.findMany({
      include: conVariantes(ahora),
      orderBy: { idProducto: 'asc' },
    });
    return productos.map(aProducto);
  }
}
