import { IsNotEmpty, IsString } from 'class-validator';

export class PagarTarjetaDto {
  @IsString()
  @IsNotEmpty()
  tokenTarjeta!: string;
}
