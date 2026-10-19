import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

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
          { talla: 'M', color: 'Negro', stock: 3 },
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
        create: [{ talla: 'UNITALLA', color: 'Negro', stock: 1 }],
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

  console.log(
    'Datos de ejemplo cargados: 3 zonas, 4 productos, 7 variantes, 5 usuarios.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
