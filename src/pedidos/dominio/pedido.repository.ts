import { Confirmacion, Pedido, Reserva } from './entidades';

export interface PedidoRepository {
  buscarCarrito(idCliente: number): Promise<Pedido | null>;
  buscarPorId(idPedido: number): Promise<Pedido | null>;
  buscarReservas(idPedido: number, ahora: Date): Promise<Reserva[]>;
  liberarReservas(idPedido: number): Promise<void>;
  confirmar(datos: Confirmacion): Promise<Pedido>;
  buscarVencidos(ahora: Date): Promise<Pedido[]>;
  cancelar(idPedido: number): Promise<void>;
}
