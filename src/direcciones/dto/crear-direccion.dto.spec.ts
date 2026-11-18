import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CrearDireccionDto } from './crear-direccion.dto';

describe('BUG-02: campos obligatorios de direccion', () => {
  it.each(['calle', 'numeroCasa', 'colonia'])('rechaza espacios en %s', async (campo) => {
    const dto = plainToInstance(CrearDireccionDto, { idZona: 1, calle: 'Hidalgo', numeroCasa: '10', colonia: 'Centro', [campo]: '   ' });
    const errores = await validate(dto);
    expect(errores.find((e) => e.property === campo)?.constraints?.isNotEmpty).toBe('Este campo es requerido');
  });
  it('acepta una direccion completa sin referencias', async () => {
    const dto = plainToInstance(CrearDireccionDto, { idZona: 1, calle: ' Hidalgo ', numeroCasa: '10', colonia: 'Centro' });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.calle).toBe('Hidalgo');
  });
});
