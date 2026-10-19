import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Direccion, NuevaDireccion, ZonaEnvio } from '../dominio/entidades';
import { DireccionRepository } from '../dominio/direccion.repository';
import { PrismaService } from '../../prisma/prisma.service';

type DireccionConZona = Prisma.DireccionGetPayload<{ include: { zona: true } }>;

function aZona(zona: Prisma.ZonaEnvioGetPayload<object>): ZonaEnvio {
  return {
    idZona: zona.idZona,
    nombre: zona.nombre,
    costoEnvio: Number(zona.costoEnvio),
  };
}

function aDireccion(direccion: DireccionConZona): Direccion {
  return {
    idDireccion: direccion.idDireccion,
    idCliente: direccion.idCliente,
    idZona: direccion.idZona,
    calle: direccion.calle,
    numeroCasa: direccion.numeroCasa,
    colonia: direccion.colonia,
    referencias: direccion.referencias,
    zona: aZona(direccion.zona),
  };
}

@Injectable()
export class DireccionPrismaRepository implements DireccionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorCliente(idCliente: number): Promise<Direccion[]> {
    const direcciones = await this.prisma.direccion.findMany({
      where: { idCliente },
      include: { zona: true },
    });
    return direcciones.map(aDireccion);
  }

  async buscarPorId(idDireccion: number): Promise<Direccion | null> {
    const direccion = await this.prisma.direccion.findUnique({
      where: { idDireccion },
      include: { zona: true },
    });
    return direccion ? aDireccion(direccion) : null;
  }

  async listarZonas(): Promise<ZonaEnvio[]> {
    const zonas = await this.prisma.zonaEnvio.findMany();
    return zonas.map(aZona);
  }

  async buscarZona(idZona: number): Promise<ZonaEnvio | null> {
    const zona = await this.prisma.zonaEnvio.findUnique({ where: { idZona } });
    return zona ? aZona(zona) : null;
  }

  async guardar(datos: NuevaDireccion): Promise<Direccion> {
    const direccion = await this.prisma.direccion.create({
      data: datos,
      include: { zona: true },
    });
    return aDireccion(direccion);
  }
}
