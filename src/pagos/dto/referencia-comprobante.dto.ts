import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReferenciaComprobanteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  numeroReferencia!: string;
}