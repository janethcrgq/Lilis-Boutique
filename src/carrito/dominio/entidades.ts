// Una prenda es una variante del producto: una talla y un color.
export interface Prenda {
  idVariante: number;
  nombre: string;
  talla: string;
  color: string;
  precio: number;
  stock: number;
}

export interface DetalleCarrito {
  idDetallePedido: number;
  idVariante: number;
  nombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitario: number;
  stock: number;
}

// El carrito es un Pedido en estado EN_CARRITO.
export interface Carrito {
  idPedido: number;
  idCliente: number;
  subtotal: number;
  detalles: DetalleCarrito[];
}

export interface Reserva {
  idVariante: number;
  cantidad: number;
  expiraEn: Date;
}

export type NuevaReserva = Omit<Reserva, 'expiraEn'>;
