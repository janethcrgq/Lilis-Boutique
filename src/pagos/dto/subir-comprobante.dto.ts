import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SubirComprobanteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  numeroReferencia!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  comprobanteURL!: string;
}
