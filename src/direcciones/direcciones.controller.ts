import { Body, Controller, Get, Post } from '@nestjs/common';
import { ClienteActual } from '../comun/decoradores/cliente-actual.decorator';
import { DireccionesService } from './direcciones.service';
import { CrearDireccionDto } from './dto/crear-direccion.dto';

// Pantalla direccionEntrega.html (pasos 7-12 del CU).
@Controller()
export class DireccionesController {
  constructor(private readonly direcciones: DireccionesService) {}

  @Get('zonas')
  zonas() {
    return this.direcciones.listarZonas();
  }

  @Get('direcciones')
  listar(@ClienteActual() idCliente: number) {
    return this.direcciones.listar(idCliente);
  }

  // 2.2.8: si la zona no existe, el service responde FueraDeZonaError (400).
  @Post('direcciones')
  crear(@ClienteActual() idCliente: number, @Body() dto: CrearDireccionDto) {
    return this.direcciones.crear(idCliente, dto);
  }
}
