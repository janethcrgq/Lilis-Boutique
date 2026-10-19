import {
  ConflictoError,
  DatoInvalidoError,
  NoEncontradoError,
} from '../../comun/errores';

export class PedidoNoEncontradoError extends NoEncontradoError {
  constructor(idPedido: number) {
    super(`No existe el pedido ${idPedido}`);
  }
}

export class CarritoVacioError extends DatoInvalidoError {
  constructor() {
    super('Tu carrito esta vacio');
  }
}

export class ReservaVencidaError extends ConflictoError {
  constructor() {
    super('Tu reserva de 15 minutos vencio, vuelve a proceder al pago');
  }
}
