import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { CarritoService } from './carrito/carrito.service';
import { DireccionesService } from './direcciones/direcciones.service';
import { PedidosService } from './pedidos/pedidos.service';
import { PagosService } from './pagos/pagos.service';

// Recorre el CU Realizar Pedido sobre los datos del seed.
//   npm run escenarios   (primero recarga los datos con el seed)

async function escenario(
  titulo: string,
  descripcion: string,
  accion: () => Promise<string>,
  esperado: 'exito' | 'rechazo',
): Promise<void> {
  console.log(`\n--- ${titulo} ---`);
  console.log(descripcion);
  try {
    const resultado = await accion();
    console.log(
      esperado === 'exito'
        ? `OK: ${resultado}`
        : `No se esperaba que esto funcionara: ${resultado}`,
    );
  } catch (error) {
    const mensaje = (error as Error).message;
    console.log(
      esperado === 'rechazo'
        ? `Rechazado como se esperaba: ${mensaje}`
        : `No se esperaba error: ${mensaje}`,
    );
  }
}

function pesos(monto: number): string {
  return `$${monto.toFixed(2)}`;
}

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const prisma = app.get(PrismaService);
  const carrito = app.get(CarritoService);
  const direcciones = app.get(DireccionesService);
  const pedidos = app.get(PedidosService);
  const pagos = app.get(PagosService);

  const idClienta = async (correo: string) =>
    (await prisma.usuario.findUniqueOrThrow({ where: { correo } })).idUsuario;
  const idPrenda = async (nombre: string, color: string) =>
    (
      await prisma.varianteProducto.findFirstOrThrow({
        where: { producto: { nombre }, color },
      })
    ).idVariante;
  const stock = async (idVariante: number) =>
    (await prisma.varianteProducto.findUniqueOrThrow({ where: { idVariante } }))
      .stock;

  const maria = await idClienta('maria@correo.com');
  const sofia = await idClienta('sofia@correo.com');
  const daniela = await idClienta('daniela@correo.com');
  const vestido = await idPrenda('Vestido midi floral', 'Negro');
  const bolsa = await idPrenda('Bolsa de mano', 'Negro');
  const [direccionMaria] = await direcciones.listar(maria);
  let idPedidoMaria = 0;

  await escenario(
    '1. Agregar al carrito',
    'Maria agrega 2 vestidos talla M negro (hay 3 en stock).',
    async () => {
      const c = await carrito.agregarPrenda(maria, {
        idVariante: vestido,
        cantidad: 2,
      });
      return `subtotal ${pesos(c.subtotal)}.`;
    },
    'exito',
  );

  await escenario(
    '2. Proceder al pago',
    'Maria presiona "Proceder al pago".',
    async () => {
      await carrito.procederAlPago(maria);
      return 'sus 2 vestidos quedan apartados 15 minutos.';
    },
    'exito',
  );

  await escenario(
    '3. Producto agotado',
    'Sofia quiere 2 vestidos iguales, pero Maria ya aparto 2 de los 3.',
    async () => {
      await carrito.agregarPrenda(sofia, { idVariante: vestido, cantidad: 2 });
      await carrito.procederAlPago(sofia);
      return 'se apartaron';
    },
    'rechazo',
  );

  await escenario(
    '4. Confirmar pedido',
    'Maria confirma con envio a domicilio (zona Centro) y pago con tarjeta.',
    async () => {
      const r = await pedidos.confirmar(maria, {
        metodoEntrega: 'DOMICILIO',
        idDireccion: direccionMaria.idDireccion,
        formaPago: 'TARJETA',
      });
      idPedidoMaria = r.pedido.idPedido;
      return `pedido ${r.pedido.numPedido}, total ${pesos(r.pedido.total)} con envio. Stock del vestido: 3 -> ${await stock(vestido)}.`;
    },
    'exito',
  );

  await escenario(
    '5. Tarjeta rechazada',
    'La pasarela rechaza la tarjeta de Maria.',
    async () => {
      await pagos.pagarConTarjeta(maria, idPedidoMaria, {
        tokenTarjeta: 'tok_rechazada',
      });
      return 'se cobro';
    },
    'rechazo',
  );

  await escenario(
    '6. Pago aprobado',
    'Maria reintenta con otra tarjeta.',
    async () => {
      await pagos.pagarConTarjeta(maria, idPedidoMaria, {
        tokenTarjeta: 'tok_visa',
      });
      const pedido = await pedidos.buscar(maria, idPedidoMaria);
      return `pedido ${pedido.estadoPedido}.`;
    },
    'exito',
  );

  await escenario(
    '7. Recoger y pagar en boutique',
    'Sofia deja 1 vestido, lo recoge en la tienda y Liliana le cobra con el folio.',
    async () => {
      const c = await carrito.verCarrito(sofia);
      await carrito.cambiarCantidad(sofia, c!.detalles[0].idDetallePedido, {
        cantidad: 1,
      });
      await carrito.procederAlPago(sofia);
      const r = await pedidos.confirmar(sofia, {
        metodoEntrega: 'RECOGER_EN_BOUTIQUE',
        formaPago: 'CONTRA_ENTREGA',
      });
      await pagos.cobrarEnBoutique(r.pago.folio ?? '');
      return `pedido ${r.pedido.numPedido} sin costo de envio, folio ${r.pago.folio}, pagado en tienda.`;
    },
    'exito',
  );

  await escenario(
    '8. Pedido vencido sin pago',
    'Daniela pide la bolsa por transferencia y nunca paga (simulamos que pasa la fecha limite).',
    async () => {
      await carrito.agregarPrenda(daniela, { idVariante: bolsa, cantidad: 1 });
      await carrito.procederAlPago(daniela);
      const r = await pedidos.confirmar(daniela, {
        metodoEntrega: 'RECOGER_EN_BOUTIQUE',
        formaPago: 'TRANSFERENCIA',
      });
      const antes = await stock(bolsa);
      await prisma.pedido.update({
        where: { idPedido: r.pedido.idPedido },
        data: { fechaLimitePago: new Date(Date.now() - 60 * 1000) },
      });
      await pedidos.cancelarVencidos();
      const pedido = await pedidos.buscar(daniela, r.pedido.idPedido);
      return `pedido ${pedido.estadoPedido}, la bolsa regresa al stock: ${antes} -> ${await stock(bolsa)}.`;
    },
    'exito',
  );

  console.log('\n=== Como quedo la base de datos ===');
  const todos = await prisma.pedido.findMany({
    where: { estadoPedido: { not: 'EN_CARRITO' } },
    include: {
      cliente: { include: { usuario: true } },
      pagos: true,
      envio: true,
    },
    orderBy: { idPedido: 'asc' },
  });
  for (const p of todos) {
    const pago = p.pagos[p.pagos.length - 1];
    console.log(
      `${p.numPedido}  ${p.cliente.usuario.nombre.padEnd(8)} ${p.estadoPedido.padEnd(10)} ${pesos(Number(p.total)).padStart(9)}  pago: ${pago.metodo} ${pago.estadoPago}  envio: ${p.envio ? 'si' : 'no'}`,
    );
  }

  await app.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
