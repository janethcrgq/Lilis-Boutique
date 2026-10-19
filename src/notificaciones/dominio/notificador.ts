// Avisos por correo del CU Realizar Pedido (requerimiento 3.5).
// El service no sabe si detras hay un servicio de correo real o solo el log.
export interface Notificador {
  // A la clienta, cuando su pago queda aprobado y el pedido pasa a PAGADO.
  pagoAprobado(
    idCliente: number,
    numPedido: string,
    monto: number,
  ): Promise<void>;

  // A la clienta, al confirmar con transferencia o contra entrega.
  comprobantePreliminar(
    idCliente: number,
    numPedido: string,
    monto: number,
    instrucciones: string,
  ): Promise<void>;

  // A la clienta, cuando su pedido vence sin pago (2.2.10).
  pedidoCancelado(idCliente: number, numPedido: string): Promise<void>;

  // A la boutique (Duena y Vendedora), cuando entra un pedido nuevo.
  nuevoPedido(
    numPedido: string,
    total: number,
    metodoEntrega: string,
  ): Promise<void>;
}
