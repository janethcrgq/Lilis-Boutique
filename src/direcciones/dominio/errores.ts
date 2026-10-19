import { DatoInvalidoError, NoEncontradoError } from '../../comun/errores';

export class DireccionNoEncontradaError extends NoEncontradoError {
  constructor(idDireccion: number) {
    super(`No existe la direccion ${idDireccion}`);
  }
}

export class FueraDeZonaError extends DatoInvalidoError {
  constructor() {
    super(
      'No hay entrega a esa direccion, solo entregamos dentro de la ciudad',
    );
  }
}
