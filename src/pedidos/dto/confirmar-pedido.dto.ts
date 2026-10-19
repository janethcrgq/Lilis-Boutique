import { IsIn, IsInt, IsOptional, IsPositive } from 'class-validator';
import type { FormaPago, MetodoEntrega } from '../dominio/entidades';

export class ConfirmarPedidoDto {
  @IsIn(['DOMICILIO', 'RECOGER_EN_BOUTIQUE'])
  metodoEntrega!: MetodoEntrega;

  // Solo para envio a domicilio.
  @IsOptional()
  @IsInt()
  @IsPositive()
  idDireccion?: number;

  @IsIn(['TARJETA', 'TRANSFERENCIA', 'CONTRA_ENTREGA'])
  formaPago!: FormaPago;
}
