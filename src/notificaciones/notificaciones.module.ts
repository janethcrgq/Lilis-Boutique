import { Module } from '@nestjs/common';
import { NotificadorLog } from './infra/notificador-log';
import { NOTIFICADOR } from './notificaciones.tokens';

@Module({
  providers: [
    {
      provide: NOTIFICADOR,
      useClass: NotificadorLog,
    },
  ],
  exports: [NOTIFICADOR],
})
export class NotificacionesModule {}
