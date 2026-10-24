import { Module } from '@nestjs/common';
import { DireccionesController } from './direcciones.controller';
import { DireccionesService } from './direcciones.service';
import { DireccionPrismaRepository } from './infra/direccion-prisma.repository';
import { DIRECCION_REPOSITORY } from './direcciones.tokens';

@Module({
  controllers: [DireccionesController],
  providers: [
    DireccionesService,
    {
      provide: DIRECCION_REPOSITORY,
      useClass: DireccionPrismaRepository,
    },
  ],
  exports: [DireccionesService],
})
export class DireccionesModule {}
