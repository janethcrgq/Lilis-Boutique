import { Module } from '@nestjs/common';
import { CarritoService } from './carrito.service';
import { CarritoPrismaRepository } from './infra/carrito-prisma.repository';
import { CARRITO_REPOSITORY } from './carrito.tokens';

@Module({
  providers: [
    CarritoService,
    {
      provide: CARRITO_REPOSITORY,
      useClass: CarritoPrismaRepository,
    },
  ],
  exports: [CarritoService],
})
export class CarritoModule {}
