import { Inject, Injectable } from '@nestjs/common';
import type { Producto } from './dominio/entidades';
import type { ProductoRepository } from './dominio/producto.repository';
import { PRODUCTO_REPOSITORY } from './productos.tokens';

@Injectable()
export class ProductosService {
  constructor(
    @Inject(PRODUCTO_REPOSITORY)
    private readonly repo: ProductoRepository,
  ) {}

  // REGLA (2.2.6-A): lo disponible descuenta lo que otras clientas apartaron.
  listar(): Promise<Producto[]> {
    return this.repo.listar(new Date());
  }
}
