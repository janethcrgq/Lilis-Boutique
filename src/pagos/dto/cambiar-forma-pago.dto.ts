import { IsIn } from 'class-validator';
import type { FormaPago } from '../dominio/entidades';

export class CambiarFormaPagoDto {
  @IsIn(['TARJETA', 'TRANSFERENCIA', 'CONTRA_ENTREGA'])
  formaPago!: FormaPago;
}
