import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

// Mientras no existe Iniciar Sesion (C2), la pagina manda el id de la
// clienta en el header x-id-cliente. Cuando haya sesion, solo cambia esto.
export const ClienteActual = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): number => {
    const req = contexto
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | undefined> }>();
    const idCliente = Number(req.headers['x-id-cliente']);

    if (!Number.isInteger(idCliente) || idCliente <= 0) {
      throw new BadRequestException('Falta el header x-id-cliente');
    }
    return idCliente;
  },
);
