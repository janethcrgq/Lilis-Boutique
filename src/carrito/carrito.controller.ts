import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ClienteActual } from '../comun/decoradores/cliente-actual.decorator';
import { CarritoService } from './carrito.service';
import { AgregarPrendaDto } from './dto/agregar-prenda.dto';
import { CambiarCantidadDto } from './dto/cambiar-cantidad.dto';

// Pantallas catalogo.html y bolsaCompra.html (pasos 1-6 del CU).
@Controller('carrito')
export class CarritoController {
  constructor(private readonly carrito: CarritoService) {}

  @Get()
  ver(@ClienteActual() idCliente: number) {
    return this.carrito.verCarrito(idCliente);
  }

  @Post('prendas')
  agregar(@ClienteActual() idCliente: number, @Body() dto: AgregarPrendaDto) {
    return this.carrito.agregarPrenda(idCliente, dto);
  }

  // 2.2.1: con cantidad 0 se elimina la prenda.
  @Patch('prendas/:id')
  cambiar(
    @ClienteActual() idCliente: number,
    @Param('id', ParseIntPipe) idDetallePedido: number,
    @Body() dto: CambiarCantidadDto,
  ) {
    return this.carrito.cambiarCantidad(idCliente, idDetallePedido, dto);
  }

  @Delete('prendas/:id')
  eliminar(
    @ClienteActual() idCliente: number,
    @Param('id', ParseIntPipe) idDetallePedido: number,
  ) {
    return this.carrito.eliminarPrenda(idCliente, idDetallePedido);
  }

  // Paso 6: aparta las prendas 15 minutos.
  @Post('proceder-al-pago')
  procederAlPago(@ClienteActual() idCliente: number) {
    return this.carrito.procederAlPago(idCliente);
  }
}
