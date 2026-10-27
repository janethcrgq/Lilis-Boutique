import 'dotenv/config';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import type { EstadoPago, FormaPago, Prisma } from '@prisma/client';
// Borra todo y carga datos de ejemplo de la boutique.
//   npm run seed
const prisma = new PrismaClient();

const TABLAS = [
  'PagoTarjeta',
  'PagoTransferencia',
  'PagoContraEntrega',
  'Pago',
  'Envio',
  'Reserva',
  'Apartado',
  'DevolucionCliente',
  'DevolucionProveedor',
  'Devolucion',
  'DetallePedido',
  'Pedido',
  'Resena',
  'SalidaInventario',
  'DetalleCompra',
  'Compra',
  'Proveedor',
  'VarianteProducto',
  'Producto',
  'Categoria',
  'Direccion',
  'ZonaEnvio',
  'Cliente',
  'Usuario',
];

// Las cuentas todavia no se usan para entrar: Iniciar Sesion es de C2.
const CONTRASENIA_PENDIENTE = 'pendiente';

async function limpiar() {
  // Se borra de las tablas hijas a las padres y se reinician los ids
  // para que los folios empiecen otra vez en LB-000001.
  for (const tabla of TABLAS) {
    await prisma.$executeRawUnsafe(`DELETE FROM \`${tabla}\``);
    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`${tabla}\` AUTO_INCREMENT = 1`,
    );
  }
}

async function main() {
  await limpiar();

  const centro = await prisma.zonaEnvio.create({
    data: { nombre: 'Centro', costoEnvio: 50 },
  });
  const norte = await prisma.zonaEnvio.create({
    data: { nombre: 'Norte', costoEnvio: 70 },
  });
  await prisma.zonaEnvio.create({ data: { nombre: 'Sur', costoEnvio: 70 } });

  const vestidos = await prisma.categoria.create({
    data: { nombre: 'Vestidos' },
  });
  const blusas = await prisma.categoria.create({ data: { nombre: 'Blusas' } });
  const calzado = await prisma.categoria.create({
    data: { nombre: 'Calzado' },
  });
  const accesorios = await prisma.categoria.create({
    data: { nombre: 'Accesorios' },
  });

  await prisma.producto.create({
    data: {
      idCategoria: vestidos.idCategoria,
      nombre: 'Vestido midi floral',
      precio: 649,
      variantes: {
        create: [
          { talla: 'M', color: 'Negro', stock: 5 },
          { talla: 'S', color: 'Rojo', stock: 5 },
        ],
      },
    },
  });
  await prisma.producto.create({
    data: {
      idCategoria: blusas.idCategoria,
      nombre: 'Blusa de lino',
      precio: 389,
      variantes: {
        create: [
          { talla: 'M', color: 'Blanco', stock: 4 },
          { talla: 'S', color: 'Beige', stock: 2 },
        ],
      },
    },
  });
  await prisma.producto.create({
    data: {
      idCategoria: calzado.idCategoria,
      nombre: 'Sandalia trenzada',
      precio: 459,
      variantes: {
        create: [
          { talla: 'T24', color: 'Cafe', stock: 2 },
          { talla: 'T25', color: 'Negro', stock: 3 },
        ],
      },
    },
  });
  await prisma.producto.create({
    data: {
      idCategoria: accesorios.idCategoria,
      nombre: 'Bolsa de mano',
      precio: 529,
      variantes: {
        create: [{ talla: 'UNITALLA', color: 'Negro', stock: 2 }],
      },
    },
  });

  await prisma.usuario.create({
    data: {
      nombre: 'Ana Lilia',
      apellido: 'Hermosillo Felix',
      correo: 'duena@lilisboutique.com',
      contraseniaHash: CONTRASENIA_PENDIENTE,
      rol: 'DUENA',
    },
  });
  await prisma.usuario.create({
    data: {
      nombre: 'Liliana',
      apellido: 'Valdez Hermosillo',
      correo: 'vendedora@lilisboutique.com',
      contraseniaHash: CONTRASENIA_PENDIENTE,
      rol: 'VENDEDORA',
    },
  });

  
  const clientas = [
    {
      nombre: 'Maria',
      apellido: 'Lopez',
      correo: 'maria@correo.com',
      idZona: centro.idZona,
    },
    {
      nombre: 'Sofia',
      apellido: 'Ramirez',
      correo: 'sofia@correo.com',
      idZona: norte.idZona,
    },
    {
      nombre: 'Daniela',
      apellido: 'Torres',
      correo: 'daniela@correo.com',
      idZona: null,
    },
  ];
  for (const c of clientas) {
    const usuario = await prisma.usuario.create({
      data: {
        nombre: c.nombre,
        apellido: c.apellido,
        correo: c.correo,
        contraseniaHash: CONTRASENIA_PENDIENTE,
        telefono: '6440000000',
        rol: 'CLIENTE',
        cliente: { create: {} },
      },
    });
    if (c.idZona) {
      await prisma.direccion.create({
        data: {
          idCliente: usuario.idUsuario,
          idZona: c.idZona,
          calle: 'Calle Hidalgo',
          numeroCasa: '120',
          colonia: c.idZona === centro.idZona ? 'Centro' : 'Cajeme',
        },
      });
    }
  }

  await crearPedidosDePrueba();

  console.log(
    'Datos de ejemplo cargados: 3 zonas, 4 productos, 7 variantes, 5 usuarios y 6 pedidos.',
  );
}


const HORA = 60 * 60 * 1000;

interface PagoDePrueba {
  metodo: FormaPago;
  estadoPago: EstadoPago;
  numeroReferencia?: string;
  comprobanteURL?: string;
  respuestaPasarela?: string;
}

interface PedidoDePrueba {
  correo: string;
  prendas: { nombre: string; color: string; cantidad: number }[];
  metodoEntrega: 'DOMICILIO' | 'RECOGER_EN_BOUTIQUE';
  estadoPedido: 'PENDIENTE_DE_PAGO' | 'PAGADO' | 'CANCELADO';
  hace: number; 
  pagos: PagoDePrueba[]; 
}


async function crearPedido(datos: PedidoDePrueba): Promise<number> {
  const usuario = await prisma.usuario.findUniqueOrThrow({
    where: { correo: datos.correo },
  });
  const direccion =
    datos.metodoEntrega === 'DOMICILIO'
      ? await prisma.direccion.findFirstOrThrow({
          where: { idCliente: usuario.idUsuario },
          include: { zona: true },
        })
      : null;

  const detalles: Prisma.DetallePedidoCreateManyPedidoInput[] = [];
  let subtotal = 0;
  for (const p of datos.prendas) {
    const variante = await prisma.varianteProducto.findFirstOrThrow({
      where: { producto: { nombre: p.nombre }, color: p.color },
      include: { producto: true },
    });
    const precio = Number(variante.producto.precio);
    subtotal += precio * p.cantidad;
    detalles.push({
      idVariante: variante.idVariante,
      cantidad: p.cantidad,
      precioUnitario: precio,
    });
  }
  const costoEnvio = direccion ? Number(direccion.zona.costoEnvio) : 0;
  const fecha = new Date(Date.now() - datos.hace * HORA);

  const pedido = await prisma.pedido.create({
    data: {
      idCliente: usuario.idUsuario,
      fecha,
      subtotal,
      total: subtotal + costoEnvio,
      estadoPedido: datos.estadoPedido,
      metodoEntrega: datos.metodoEntrega,
      fechaLimitePago: new Date(fecha.getTime() + 48 * HORA),
      detalles: { createMany: { data: detalles } },
    },
  });
  await prisma.pedido.update({
    where: { idPedido: pedido.idPedido },
    data: { numPedido: `LB-${String(pedido.idPedido).padStart(6, '0')}` },
  });

  if (direccion) {
    await prisma.envio.create({
      data: {
        idPedido: pedido.idPedido,
        idDireccion: direccion.idDireccion,
        costoEnvio,
      },
    });
  }
  if (datos.estadoPedido !== 'CANCELADO') {
    for (const d of detalles) {
      await prisma.varianteProducto.update({
        where: { idVariante: d.idVariante },
        data: { stock: { decrement: d.cantidad } },
      });
    }
  }

  for (const p of datos.pagos) {
    const pago = await prisma.pago.create({
      data: {
        idPedido: pedido.idPedido,
        monto: subtotal + costoEnvio,
        metodo: p.metodo,
        estadoPago: p.estadoPago,
      },
    });
    if (p.metodo === 'TARJETA') {
      await prisma.pagoTarjeta.create({
        data: {
          idPago: pago.idPago,
          idTransaccion: p.respuestaPasarela ? `SIM-${pago.idPago}` : null,
          respuestaPasarela: p.respuestaPasarela ?? null,
        },
      });
    }
    if (p.metodo === 'TRANSFERENCIA') {
      await prisma.pagoTransferencia.create({
        data: {
          idPago: pago.idPago,
          numeroReferencia: p.numeroReferencia ?? null,
          comprobanteURL: p.comprobanteURL ?? null,
        },
      });
    }
    if (p.metodo === 'CONTRA_ENTREGA') {
      await prisma.pagoContraEntrega.create({
        data: {
          idPago: pago.idPago,
          folio: `CE-${String(pago.idPago).padStart(6, '0')}`,
        },
      });
    }
  }
  return pedido.idPedido;
}

async function crearPedidosDePrueba() {
  const carpeta = join(process.cwd(), 'uploads', 'comprobantes');
  await mkdir(carpeta, { recursive: true });
  await writeFile(join(carpeta, 'comprobante-prueba.pdf'), PDF_DE_PRUEBA);

  await crearPedido({
    correo: 'maria@correo.com',
    prendas: [
      { nombre: 'Vestido midi floral', color: 'Negro', cantidad: 1 },
      { nombre: 'Blusa de lino', color: 'Blanco', cantidad: 2 },
      { nombre: 'Bolsa de mano', color: 'Negro', cantidad: 1 },
    ],
    metodoEntrega: 'DOMICILIO',
    estadoPedido: 'PAGADO',
    hace: 2,
    pagos: [
      {
        metodo: 'TARJETA',
        estadoPago: 'APROBADO',
        respuestaPasarela: 'Cobro aprobado',
      },
    ],
  });

  await crearPedido({
    correo: 'maria@correo.com',
    prendas: [{ nombre: 'Vestido midi floral', color: 'Rojo', cantidad: 1 }],
    metodoEntrega: 'DOMICILIO',
    estadoPedido: 'PENDIENTE_DE_PAGO',
    hace: 1,
    pagos: [
      {
        metodo: 'TARJETA',
        estadoPago: 'RECHAZADO',
        respuestaPasarela: 'Fondos insuficientes',
      },
      { metodo: 'TARJETA', estadoPago: 'PENDIENTE' },
    ],
  });

  await crearPedido({
    correo: 'sofia@correo.com',
    prendas: [
      { nombre: 'Blusa de lino', color: 'Beige', cantidad: 1 },
      { nombre: 'Sandalia trenzada', color: 'Negro', cantidad: 1 },
    ],
    metodoEntrega: 'DOMICILIO',
    estadoPedido: 'PENDIENTE_DE_PAGO',
    hace: 1,
    pagos: [{ metodo: 'TRANSFERENCIA', estadoPago: 'PENDIENTE' }],
  });

  await crearPedido({
    correo: 'sofia@correo.com',
    prendas: [{ nombre: 'Blusa de lino', color: 'Blanco', cantidad: 1 }],
    metodoEntrega: 'DOMICILIO',
    estadoPedido: 'PENDIENTE_DE_PAGO',
    hace: 3,
    pagos: [
      {
        metodo: 'TRANSFERENCIA',
        estadoPago: 'PENDIENTE',
        numeroReferencia: 'MBAN01002610230091',
        comprobanteURL: '/uploads/comprobantes/comprobante-prueba.pdf',
      },
    ],
  });

  await crearPedido({
    correo: 'daniela@correo.com',
    prendas: [{ nombre: 'Vestido midi floral', color: 'Negro', cantidad: 1 }],
    metodoEntrega: 'RECOGER_EN_BOUTIQUE',
    estadoPedido: 'PENDIENTE_DE_PAGO',
    hace: 1,
    pagos: [{ metodo: 'CONTRA_ENTREGA', estadoPago: 'PENDIENTE' }],
  });

  await crearPedido({
    correo: 'daniela@correo.com',
    prendas: [{ nombre: 'Sandalia trenzada', color: 'Cafe', cantidad: 1 }],
    metodoEntrega: 'RECOGER_EN_BOUTIQUE',
    estadoPedido: 'CANCELADO',
    hace: 72,
    pagos: [{ metodo: 'TRANSFERENCIA', estadoPago: 'CANCELADO' }],
  });
}

const PDF_DE_PRUEBA = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 120]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 52>>stream
BT /F1 14 Tf 30 60 Td (Comprobante de prueba) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF
`;


main()

  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
