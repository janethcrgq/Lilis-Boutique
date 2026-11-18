import { Transform } from 'class-transformer';
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
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty({ message: 'Este campo es requerido' })
  @MaxLength(150)
  calle!: string;

  @IsString()
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty({ message: 'Este campo es requerido' })
  @MaxLength(20)
  numeroCasa!: string;

  @IsString()
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty({ message: 'Este campo es requerido' })
  @MaxLength(100)
  colonia!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  referencias?: string;
}
