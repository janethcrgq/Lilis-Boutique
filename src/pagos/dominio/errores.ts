import {
  ConflictoError,
  DatoInvalidoError,
  NoEncontradoError,
  ServicioNoDisponibleError,
} from '../../comun/errores';

export class PagoNoEncontradoError extends NoEncontradoError {
  constructor() {
    super('No hay un pago pendiente para este pedido');
  }
}

export class OtroMetodoDePagoError extends ConflictoError {
  constructor(metodo: string) {
    super(`Este pedido se paga con ${metodo}`);
  }
}

export class ContraEntregaNoPermitidaError extends DatoInvalidoError {
  constructor() {
    super('El pago contra entrega solo aplica si recoges en boutique');
  }
}

export class PagoRechazadoError extends ConflictoError {
  constructor() {
    super(
      'El pago fue rechazado, puedes reintentar o elegir otro metodo de pago',
    );
  }
}

export class PasarelaNoDisponibleError extends ServicioNoDisponibleError {
  constructor() {
    super(
      'El pago con tarjeta no esta disponible por el momento, reintenta o elige otro metodo de pago',
    );
  }
}

export class SinComprobanteError extends DatoInvalidoError {
  constructor() {
    super('La transferencia todavia no tiene comprobante');
  }
}

export class PedidoNoEncontradoError extends NoEncontradoError {
  constructor() {
    super('No encontramos ese pedido');
  }
}
