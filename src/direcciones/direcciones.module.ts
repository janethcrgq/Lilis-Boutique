import { Module } from '@nestjs/common';
import { DireccionesService } from './direcciones.service';
import { DireccionPrismaRepository } from './infra/direccion-prisma.repository';
import { DIRECCION_REPOSITORY } from './direcciones.tokens';

@Module({
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
