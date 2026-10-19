import { Injectable } from '@nestjs/common';
import { ResultadoPasarela } from '../dominio/entidades';
import { PasarelaPagos } from '../dominio/pasarela-pagos';

// Pasarela de prueba para el prototipo. Cuando se elija la pasarela real
// solo se cambia el useClass en pagos.module.ts.
//   tok_rechazada    -> la pasarela rechaza el cobro
//   tok_sin_conexion -> la pasarela no responde
//   cualquier otro   -> cobro aprobado
@Injectable()
export class PasarelaSimulada implements PasarelaPagos {
  async cobrar(
    monto: number,
    tokenTarjeta: string,
  ): Promise<ResultadoPasarela> {
    if (tokenTarjeta === 'tok_sin_conexion') {
      throw new Error('Sin conexion con la pasarela');
    }

    const aprobado = tokenTarjeta !== 'tok_rechazada';
    return {
      aprobado,
      idTransaccion: `SIM-${Date.now()}`,
      respuesta: aprobado
        ? `Cobro de $${monto} aprobado`
        : 'Fondos insuficientes',
    };
  }
}
