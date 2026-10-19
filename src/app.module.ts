import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CarritoModule } from './carrito/carrito.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { PagosModule } from './pagos/pagos.module';
import { EnviosModule } from './envios/envios.module';
import { DireccionesModule } from './direcciones/direcciones.module';
import { ProductosModule } from './productos/productos.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, CarritoModule, PedidosModule, PagosModule, EnviosModule, DireccionesModule, ProductosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
