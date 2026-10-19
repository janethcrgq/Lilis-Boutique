export type FormaPago = 'TARJETA' | 'TRANSFERENCIA' | 'CONTRA_ENTREGA';

export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'CANCELADO';

export interface Pago {
  idPago: number;
  idPedido: number;
  idCliente: number;
  numPedido: string | null;
  estadoPedido: string;
  metodoEntrega: string | null;
  monto: number;
  fecha: Date;
  estadoPago: EstadoPago;
  metodo: FormaPago;
  folio: string | null;
  numeroReferencia: string | null;
  comprobanteURL: string | null;
}

export interface DatosTarjeta {
  idTransaccion: string;
  respuestaPasarela: string;
}

export interface ResultadoPasarela {
  aprobado: boolean;
  idTransaccion: string;
  respuesta: string;
}

export interface InstruccionesDePago {
  idPago: number;
  metodo: FormaPago;
  monto: number;
  mensaje: string;
  banco?: string;
  clabe?: string;
  concepto?: string;
  folio?: string;
}
