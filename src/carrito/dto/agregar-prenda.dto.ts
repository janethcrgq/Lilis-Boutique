import { IsInt, IsPositive } from 'class-validator';

export class AgregarPrendaDto {
  @IsInt()
  @IsPositive()
  idVariante!: number;

  @IsInt()
  @IsPositive()
  cantidad!: number;
}
