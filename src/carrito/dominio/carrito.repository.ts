import { Carrito, NuevaReserva, Prenda, Reserva } from './entidades';

export interface CarritoRepository {
  buscarCarrito(idCliente: number): Promise<Carrito | null>;
  crearCarrito(idCliente: number): Promise<Carrito>;
  buscarPrenda(idVariante: number): Promise<Prenda | null>;
  agregarDetalle(
    idPedido: number,
    idVariante: number,
    cantidad: number,
    precioUnitario: number,
  ): Promise<void>;
  cambiarCantidad(idDetallePedido: number, cantidad: number): Promise<void>;
  eliminarDetalle(idDetallePedido: number): Promise<void>;
  guardarSubtotal(idPedido: number, subtotal: number): Promise<void>;
  reservadoPorOtros(
    idVariante: number,
    idPedido: number,
    ahora: Date,
  ): Promise<number>;
  buscarReservas(idPedido: number, ahora: Date): Promise<Reserva[]>;
  reservar(
    idPedido: number,
    reservas: NuevaReserva[],
    expiraEn: Date,
  ): Promise<void>;
  liberarReservas(idPedido: number): Promise<void>;
}
