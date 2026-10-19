import { Module } from '@nestjs/common';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { PagosService } from './pagos.service';
import { PagoPrismaRepository } from './infra/pago-prisma.repository';
import { PasarelaSimulada } from './infra/pasarela-simulada';
import { PAGO_REPOSITORY, PASARELA_PAGOS } from './pagos.tokens';

@Module({
  imports: [NotificacionesModule],
  providers: [
    PagosService,
    {
      provide: PAGO_REPOSITORY,
      useClass: PagoPrismaRepository,
    },
    {
      provide: PASARELA_PAGOS,
      useClass: PasarelaSimulada,
    },
  ],
  exports: [PagosService],
})
export class PagosModule {}
