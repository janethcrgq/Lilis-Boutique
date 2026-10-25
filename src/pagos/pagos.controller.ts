import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { ClienteActual } from '../comun/decoradores/cliente-actual.decorator';
import { PagosService } from './pagos.service';
import { PagarTarjetaDto } from './dto/pagar-tarjeta.dto';
import { CambiarFormaPagoDto } from './dto/cambiar-forma-pago.dto';
import { ReferenciaComprobanteDto } from './dto/referencia-comprobante.dto';


// Tipos de archivo permitidos para el comprobante y su extension.
const TIPOS_PERMITIDOS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};
const MAXIMO_BYTES = 5 * 1024 * 1024; // 5 MB

// Pantalla estadoPedido.html 
@Controller('pedidos/:id/pago')
export class PagosController {
  constructor(private readonly pagos: PagosService) {}

  @Get()
  estado(
    @ClienteActual() idCliente: number,
    @Param('id', ParseIntPipe) idPedido: number,
  ) {
    return this.pagos.estadoDelPago(idCliente, idPedido);
  }

  @Post('tarjeta')
  pagarConTarjeta(
    @ClienteActual() idCliente: number,
    @Param('id', ParseIntPipe) idPedido: number,
    @Body() dto: PagarTarjetaDto,
  ) {
    return this.pagos.pagarConTarjeta(idCliente, idPedido, dto);
  }

  @Put('forma')
  cambiarForma(
    @ClienteActual() idCliente: number,
    @Param('id', ParseIntPipe) idPedido: number,
    @Body() dto: CambiarFormaPagoDto,
  ) {
    return this.pagos.cambiarFormaPago(idCliente, idPedido, dto);
  }

  @Get('instrucciones')
  instrucciones(@Param('id', ParseIntPipe) idPedido: number) {
    return this.pagos.instruccionesDePedido(idPedido);
  }


  // La pagina manda un FormData con "comprobante" (archivo) y "numeroReferencia".
  @Post('comprobante')
  @UseInterceptors(
    FileInterceptor('comprobante', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'comprobantes'),
        filename: (_req, archivo, devolver) => {
          const unico = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          devolver(null, `comprobante-${unico}${TIPOS_PERMITIDOS[archivo.mimetype]}`);
        },
      }),
      limits: { fileSize: MAXIMO_BYTES },
      fileFilter: (_req, archivo, devolver) => {
        if (TIPOS_PERMITIDOS[archivo.mimetype]) {
          devolver(null, true);
          return;
        }
        devolver(
          new BadRequestException('El comprobante debe ser una imagen o un PDF'),
          false,
        );
      },
    }),
  )
  async subirComprobante(
    @ClienteActual() idCliente: number,
    @Param('id', ParseIntPipe) idPedido: number,
    @Body() dto: ReferenciaComprobanteDto,
    @UploadedFile() archivo: Express.Multer.File | undefined,
  ) {
    if (!archivo) {
      throw new BadRequestException('Falta el archivo del comprobante');
    }
    try {
      return await this.pagos.subirComprobante(idCliente, idPedido, {
        numeroReferencia: dto.numeroReferencia,
        comprobanteURL: `/uploads/comprobantes/${archivo.filename}`,
      });
    } catch (error) {
      // Si el service no lo acepto, el archivo ya guardado no sirve de nada.
      await unlink(archivo.path).catch(() => undefined);
      throw error;
    }
  }
}