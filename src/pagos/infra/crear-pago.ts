import { Prisma } from '@prisma/client';
import { FormaPago } from '../dominio/entidades';

// Crea el Pago con su tabla hija segun el metodo. Se usa dentro de una
// transaccion, por eso recibe tx (tambien la usa la confirmacion del pedido).
export async function crearPago(
  tx: Prisma.TransactionClient,
  idPedido: number,
  metodo: FormaPago,
  monto: number,
): Promise<number> {
  const pago = await tx.pago.create({ data: { idPedido, metodo, monto } });

  if (metodo === 'TARJETA') {
    await tx.pagoTarjeta.create({ data: { idPago: pago.idPago } });
  }
  if (metodo === 'TRANSFERENCIA') {
    await tx.pagoTransferencia.create({ data: { idPago: pago.idPago } });
  }
  if (metodo === 'CONTRA_ENTREGA') {
    await tx.pagoContraEntrega.create({
      data: {
        idPago: pago.idPago,
        folio: `CE-${String(pago.idPago).padStart(6, '0')}`,
      },
    });
  }

  return pago.idPago;
}
