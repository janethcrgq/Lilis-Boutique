import { Producto } from './entidades';

export interface ProductoRepository {
  listar(ahora: Date): Promise<Producto[]>;
}
