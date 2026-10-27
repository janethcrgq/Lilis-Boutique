import { Controller, Get } from '@nestjs/common';
import { ProductosService } from './productos.service';

// Pantalla catalogo.html.
@Controller('productos')
export class ProductosController {
  constructor(private readonly productos: ProductosService) {}

  @Get()
  listar() {
    return this.productos.listar();
  }
}
