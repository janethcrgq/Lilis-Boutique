import { Inject, Injectable } from '@nestjs/common';
import type { Direccion, ZonaEnvio } from './dominio/entidades';
import type { DireccionRepository } from './dominio/direccion.repository';
import {
  DireccionNoEncontradaError,
  FueraDeZonaError,
} from './dominio/errores';
import { CrearDireccionDto } from './dto/crear-direccion.dto';
import { DIRECCION_REPOSITORY } from './direcciones.tokens';

@Injectable()
export class DireccionesService {
  constructor(
    @Inject(DIRECCION_REPOSITORY)
    private readonly repo: DireccionRepository,
  ) {}

  listar(idCliente: number): Promise<Direccion[]> {
    return this.repo.listarPorCliente(idCliente);
  }

  listarZonas(): Promise<ZonaEnvio[]> {
    return this.repo.listarZonas();
  }

  async crear(idCliente: number, dto: CrearDireccionDto): Promise<Direccion> {
    // REGLA (2.2.8): la boutique solo entrega en sus zonas de envio.
    const zona = await this.repo.buscarZona(dto.idZona);
    if (!zona) {
      throw new FueraDeZonaError();
    }

    return this.repo.guardar({
      idCliente,
      idZona: dto.idZona,
      calle: dto.calle,
      numeroCasa: dto.numeroCasa,
      colonia: dto.colonia,
      referencias: dto.referencias ?? null,
    });
  }

  async buscar(idCliente: number, idDireccion: number): Promise<Direccion> {
    // Una clienta solo puede usar sus propias direcciones.
    const direccion = await this.repo.buscarPorId(idDireccion);
    if (!direccion || direccion.idCliente !== idCliente) {
      throw new DireccionNoEncontradaError(idDireccion);
    }
    return direccion;
  }

  // Paso 12 del CU: el costo de envio sale de la zona de la direccion.
  async calcularCostoEnvio(
    idCliente: number,
    idDireccion: number,
  ): Promise<number> {
    const direccion = await this.buscar(idCliente, idDireccion);
    return direccion.zona.costoEnvio;
  }
}
