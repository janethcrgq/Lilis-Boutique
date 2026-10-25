import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { PagosService } from './pagos.service';


@Controller('boutique')
export class BoutiqueController {
  constructor(private readonly pagos: PagosService) {}

  @Get('transferencias')
  transferencias() {
    return this.pagos.listarTransferenciasPendientes();
  }

  @Post('transferencias/:idPago/aprobar')
  aprobar(@Param('idPago', ParseIntPipe) idPago: number) {
    return this.pagos.aprobarTransferencia(idPago);
  }

  @Get('folios/:folio')
  buscarFolio(@Param('folio') folio: string) {
    return this.pagos.buscarPorFolio(folio);
  }

  @Post('folios/:folio/cobrar')
  cobrar(@Param('folio') folio: string) {
    return this.pagos.cobrarEnBoutique(folio);
  }
}