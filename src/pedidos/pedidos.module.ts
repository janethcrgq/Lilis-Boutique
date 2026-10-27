import { Module } from '@nestjs/common';
import { EnviosModule } from '../envios/envios.module';
import { PagosModule } from '../pagos/pagos.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { PedidosVencidosTarea } from './pedidos-vencidos.tarea';
import { PedidoPrismaRepository } from './infra/pedido-prisma.repository';
import { PEDIDO_REPOSITORY } from './pedidos.tokens';

@Module({
  imports: [EnviosModule, PagosModule, NotificacionesModule],
  controllers: [PedidosController],
  providers: [
    PedidosService,
    PedidosVencidosTarea,
    {
      provide: PEDIDO_REPOSITORY,
      useClass: PedidoPrismaRepository,
    },
  ],
  exports: [PedidosService],
})
export class PedidosModule {}
