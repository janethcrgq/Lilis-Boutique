import { Direccion, NuevaDireccion, ZonaEnvio } from './entidades';

export interface DireccionRepository {
  listarPorCliente(idCliente: number): Promise<Direccion[]>;
  buscarPorId(idDireccion: number): Promise<Direccion | null>;
  listarZonas(): Promise<ZonaEnvio[]>;
  buscarZona(idZona: number): Promise<ZonaEnvio | null>;
  guardar(datos: NuevaDireccion): Promise<Direccion>;
}
