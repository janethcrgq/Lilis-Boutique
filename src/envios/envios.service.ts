import { Inject, Injectable } from '@nestjs/common';
import type { Envio, MetodoEntrega } from './dominio/entidades';
import type { EnvioRepository } from './dominio/envio.repository';
import { DireccionRequeridaError } from './dominio/errores';
import { DireccionesService } from '../direcciones/direcciones.service';
import { ENVIO_REPOSITORY } from './envios.tokens';

@Injectable()
export class EnviosService {
  constructor(
    @Inject(ENVIO_REPOSITORY)
    private readonly repo: EnvioRepository,
    private readonly direccionesService: DireccionesService,
  ) {}

  buscarPorPedido(idPedido: number): Promise<Envio | null> {
    return this.repo.buscarPorPedido(idPedido);
  }

  async calcularCosto(
    idCliente: number,
    metodoEntrega: MetodoEntrega,
    idDireccion?: number,
  ): Promise<number> {
    // REGLA (2.2.2): recoger en boutique no cobra envio.
    if (metodoEntrega === 'RECOGER_EN_BOUTIQUE') {
      return 0;
    }

    if (!idDireccion) {
      throw new DireccionRequeridaError();
    }
    return this.direccionesService.calcularCostoEnvio(idCliente, idDireccion);
  }
}
