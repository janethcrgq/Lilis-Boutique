import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ConflictoError,
  DatoInvalidoError,
  ErrorDeDominio,
  NoEncontradoError,
  ServicioNoDisponibleError,
} from '../errores';

@Catch(ErrorDeDominio)
export class DominioExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Dominio');

  private codigoPara(error: ErrorDeDominio): number {
    if (error instanceof NoEncontradoError) {
      return HttpStatus.NOT_FOUND;
    }
    if (error instanceof DatoInvalidoError) {
      return HttpStatus.BAD_REQUEST;
    }
    if (error instanceof ConflictoError) {
      return HttpStatus.CONFLICT;
    }
    if (error instanceof ServicioNoDisponibleError) {
      return HttpStatus.SERVICE_UNAVAILABLE;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  catch(error: ErrorDeDominio, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<{ url: string; method: string }>();
    const estado = this.codigoPara(error);

    this.logger.warn(
      `${req.method} ${req.url} -> ${estado} ${error.constructor.name}`,
    );

    res.status(estado).json({
      statusCode: estado,
      error: error.constructor.name,
      message: error.message,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
