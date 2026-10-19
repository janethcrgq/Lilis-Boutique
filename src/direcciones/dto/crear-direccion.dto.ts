import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CrearDireccionDto {
  @IsInt()
  @IsPositive()
  idZona!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  calle!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  numeroCasa!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  colonia!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  referencias?: string;
}
