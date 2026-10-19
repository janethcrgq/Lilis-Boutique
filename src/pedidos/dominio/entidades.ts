export type EstadoPedido =
  | 'EN_CARRITO'
  | 'PENDIENTE_DE_PAGO'
  | 'PAGADO'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO';

export type MetodoEntrega = 'DOMICILIO' | 'RECOGER_EN_BOUTIQUE';

export type FormaPago = 'TARJETA' | 'TRANSFERENCIA' | 'CONTRA_ENTREGA';

export interface DetallePedido {
  idDetallePedido: number;
  idVariante: number;
  nombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Pedido {
  idPedido: number;
  idCliente: number;
  numPedido: string | null;
  fecha: Date;
  subtotal: number;
  total: number;
  estadoPedido: EstadoPedido;
  metodoEntrega: MetodoEntrega | null;
  fechaLimitePago: Date | null;
  detalles: DetallePedido[];
}

export interface Reserva {
  idVariante: number;
  cantidad: number;
}

// Lo que se guarda al presionar "Confirmar pedido" (paso 18 del CU).
export interface Confirmacion {
  idPedido: number;
  numPedido: string;
  metodoEntrega: MetodoEntrega;
  total: number;
  fechaLimitePago: Date;
  formaPago: FormaPago;
  envio: { idDireccion: number; costoEnvio: number } | null;
}
