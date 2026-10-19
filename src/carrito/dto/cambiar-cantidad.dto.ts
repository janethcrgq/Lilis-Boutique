import { IsInt, Min } from 'class-validator';

// Cantidad 0 quita la prenda del carrito.
export class CambiarCantidadDto {
  @IsInt()
  @Min(0)
  cantidad!: number;
}
