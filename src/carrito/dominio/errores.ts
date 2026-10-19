import {
  ConflictoError,
  DatoInvalidoError,
  NoEncontradoError,
} from '../../comun/errores';

export class PrendaNoEncontradaError extends NoEncontradoError {
  constructor(idVariante: number) {
    super(`No existe la prenda ${idVariante}`);
  }
}

export class DetalleNoEncontradoError extends NoEncontradoError {
  constructor(idDetallePedido: number) {
    super(`El detalle ${idDetallePedido} no esta en tu carrito`);
  }
}

export class CarritoVacioError extends DatoInvalidoError {
  constructor() {
    super('Tu carrito esta vacio');
  }
}

export class SinExistenciaError extends ConflictoError {
  constructor(
    nombre: string,
    talla: string,
    color: string,
    disponibles: number,
  ) {
    super(
      `Solo quedan ${disponibles} piezas de ${nombre} talla ${talla} color ${color}`,
    );
  }
}
