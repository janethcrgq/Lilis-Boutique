import { Envio } from './entidades';

export interface EnvioRepository {
  buscarPorPedido(idPedido: number): Promise<Envio | null>;
}
