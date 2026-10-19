import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PedidosService } from './pedidos.service';

// 2.2.10: cada 10 minutos se cancelan los pedidos que pasaron su
// fecha limite de pago sin un pago aprobado.
@Injectable()
export class PedidosVencidosTarea {
  private readonly logger = new Logger('PedidosVencidos');

  constructor(private readonly pedidosService: PedidosService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async revisar() {
    const cancelados = await this.pedidosService.cancelarVencidos();
    if (cancelados > 0) {
      this.logger.log(`Se cancelaron ${cancelados} pedidos vencidos`);
    }
  }
}
