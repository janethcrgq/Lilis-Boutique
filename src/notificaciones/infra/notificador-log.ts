import { Injectable, Logger } from '@nestjs/common';
import { Notificador } from '../dominio/notificador';

// Para el prototipo los correos solo se escriben en la consola. Cuando
// haya servicio de correo se cambia el useClass en notificaciones.module.ts.
@Injectable()
export class NotificadorLog implements Notificador {
  private readonly logger = new Logger('Correo');

  async pagoAprobado(idCliente: number, numPedido: string, monto: number) {
    this.logger.log(
      `Clienta ${idCliente}: tu pedido ${numPedido} por $${monto} quedo pagado`,
    );
  }

  async comprobantePreliminar(
    idCliente: number,
    numPedido: string,
    monto: number,
    instrucciones: string,
  ) {
    this.logger.log(
      `Clienta ${idCliente}: pedido ${numPedido} por $${monto}. ${instrucciones}`,
    );
  }

  async pedidoCancelado(idCliente: number, numPedido: string) {
    this.logger.log(
      `Clienta ${idCliente}: tu pedido ${numPedido} se cancelo por falta de pago`,
    );
  }

  async nuevoPedido(numPedido: string, total: number, metodoEntrega: string) {
    this.logger.log(
      `Boutique: nuevo pedido ${numPedido} por $${total} (${metodoEntrega})`,
    );
  }
}
