import { Module } from '@nestjs/common';
import { ProductosController } from './productos.controller';
import { ProductosService } from './productos.service';
import { ProductoPrismaRepository } from './infra/producto-prisma.repository';
import { PRODUCTO_REPOSITORY } from './productos.tokens';

@Module({
  controllers: [ProductosController],
  providers: [
    ProductosService,
    {
      provide: PRODUCTO_REPOSITORY,
      useClass: ProductoPrismaRepository,
    },
  ],
  exports: [ProductosService],
})
export class ProductosModule {}
