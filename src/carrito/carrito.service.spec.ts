import { CarritoService } from './carrito.service';
import { CarritoRepository } from './dominio/carrito.repository';
import { SinExistenciaError } from './dominio/errores';

describe('BUG-01: limites de stock', () => {
  const detalle = { idDetallePedido: 10, idVariante: 1, nombre: 'Blusa', talla: 'S', color: 'Beige', stock: 2, cantidad: 2, precioUnitario: 389, categoria: 'Blusas', imagenURL: null };
  let repo: jest.Mocked<CarritoRepository>;
  let servicio: CarritoService;
  beforeEach(() => {
    repo = {
      buscarCarrito: jest.fn().mockResolvedValue({ idPedido: 1, idCliente: 3, subtotal: 778, detalles: [{ ...detalle }] }),
      buscarPrenda: jest.fn().mockResolvedValue({ ...detalle, precio: 389 }),
      reservadoPorOtros: jest.fn().mockResolvedValue(0),
      cambiarCantidad: jest.fn(), agregarDetalle: jest.fn(), guardarSubtotal: jest.fn(),
      buscarReservas: jest.fn().mockResolvedValue([]), eliminarDetalle: jest.fn(),
      liberarReservas: jest.fn(), crearCarrito: jest.fn(), reservar: jest.fn(),
    };
    servicio = new CarritoService(repo);
  });
  it('rechaza el incremento sin modificar cantidad ni subtotal', async () => {
    await expect(servicio.cambiarCantidad(3, 10, { cantidad: 3 })).rejects.toBeInstanceOf(SinExistenciaError);
    expect(repo.cambiarCantidad.mock.calls).toHaveLength(0);
    expect(repo.guardarSubtotal.mock.calls).toHaveLength(0);
  });
  it('rechaza agregar repetidamente la misma variante desde el catalogo', async () => {
    await expect(servicio.agregarPrenda(3, { idVariante: 1, cantidad: 1 })).rejects.toBeInstanceOf(SinExistenciaError);
    expect(repo.cambiarCantidad.mock.calls).toHaveLength(0);
    expect(repo.agregarDetalle.mock.calls).toHaveLength(0);
  });
  it('descuenta las reservas de otras clientas antes de agregar', async () => {
    repo.buscarCarrito.mockResolvedValue({ idPedido: 1, idCliente: 3, subtotal: 0, detalles: [] });
    repo.reservadoPorOtros.mockResolvedValue(2);
    await expect(servicio.agregarPrenda(3, { idVariante: 1, cantidad: 1 })).rejects.toBeInstanceOf(SinExistenciaError);
    expect(repo.agregarDetalle.mock.calls).toHaveLength(0);
  });
  it('permite llegar exactamente al limite', async () => {
    await servicio.cambiarCantidad(3, 10, { cantidad: 2 });
    expect(repo.cambiarCantidad.mock.calls).toContainEqual([10, 2]);
    expect(repo.guardarSubtotal.mock.calls).toContainEqual([1, 778]);
  });
  it('permite eliminar con cantidad cero aunque no quede stock', async () => {
    await servicio.cambiarCantidad(3, 10, { cantidad: 0 });
    expect(repo.eliminarDetalle.mock.calls).toContainEqual([10]);
  });
});
