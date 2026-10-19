import { DatoInvalidoError } from '../../comun/errores';

export class DireccionRequeridaError extends DatoInvalidoError {
  constructor() {
    super('Para envio a domicilio hay que elegir una direccion');
  }
}
