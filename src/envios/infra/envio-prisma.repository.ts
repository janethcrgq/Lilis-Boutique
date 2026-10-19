import { Injectable } from '@nestjs/common';
import { Envio } from '../dominio/entidades';
import { EnvioRepository } from '../dominio/envio.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EnvioPrismaRepository implements EnvioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorPedido(idPedido: number): Promise<Envio | null> {
    const envio = await this.prisma.envio.findUnique({ where: { idPedido } });
    if (!envio) return null;
    return { ...envio, costoEnvio: Number(envio.costoEnvio) };
  }
}
