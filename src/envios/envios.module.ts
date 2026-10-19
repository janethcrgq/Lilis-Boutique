import { Module } from '@nestjs/common';
import { DireccionesModule } from '../direcciones/direcciones.module';
import { EnviosService } from './envios.service';
import { EnvioPrismaRepository } from './infra/envio-prisma.repository';
import { ENVIO_REPOSITORY } from './envios.tokens';

@Module({
  imports: [DireccionesModule],
  providers: [
    EnviosService,
    {
      provide: ENVIO_REPOSITORY,
      useClass: EnvioPrismaRepository,
    },
  ],
  exports: [EnviosService],
})
export class EnviosModule {}
