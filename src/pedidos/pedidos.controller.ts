import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ClienteActual } from '../comun/decoradores/cliente-actual.decorator';
import { PedidosService } from './pedidos.service';
import { ConfirmarPedidoDto } from './dto/confirmar-pedido.dto';

// Pantallas confirmacionPedido.html y misPedidos.html.
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidos: PedidosService) {}

  @Get()
  listar(@ClienteActual() idCliente: number) {
    return this.pedidos.listar(idCliente);
  }

  // Pasos 17-18: si la reserva ya vencio responde ReservaVencidaError.
  @Post('confirmar')
  confirmar(
    @ClienteActual() idCliente: number,
    @Body() dto: ConfirmarPedidoDto,
  ) {
    return this.pedidos.confirmar(idCliente, dto);
  }

  @Get(':id')
  buscar(
    @ClienteActual() idCliente: number,
    @Param('id', ParseIntPipe) idPedido: number,
  ) {
    return this.pedidos.buscar(idCliente, idPedido);
  }
}
