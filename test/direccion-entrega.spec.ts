import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

describe('BUG-02: mensajes por campo en el formulario', () => {
  function formulario(valores: Record<string, string>) {
    const campos: Record<string, any> = {};
    for (const id of ['calle', 'numero', 'colonia', 'zona']) {
      campos[id] = { value: valores[id] ?? '', focus: jest.fn(), setAttribute: jest.fn(), closest: () => ({ classList: { toggle: jest.fn() } }) };
      campos['error-' + id] = { textContent: '' };
    }
    campos.referencias = { value: '' };
    const contexto = {
      document: { addEventListener: jest.fn(), getElementById: (id: string) => campos[id] },
      mostrarAviso: jest.fn(),
    };
    runInNewContext(readFileSync('public/js/direccionEntrega.js', 'utf8') + '\n estado.zonas = [{ idZona: 1 }];', contexto);
    return { campos, contexto };
  }
  it('marca todos los obligatorios vacios y enfoca el primero', () => {
    const { campos, contexto } = formulario({});
    expect(runInNewContext('leerFormulario()', contexto)).toBeNull();
    for (const id of ['calle', 'numero', 'colonia', 'zona']) {
      expect(campos['error-' + id].textContent).toBe('Este campo es requerido');
      expect(campos[id].setAttribute).toHaveBeenCalledWith('aria-invalid', 'true');
    }
    expect(campos.calle.focus).toHaveBeenCalled();
  });
  it('marca solo la calle omitida y limpia el error al corregir', () => {
    const { campos, contexto } = formulario({ calle: '  ', numero: '10', colonia: 'Centro', zona: '1' });
    expect(runInNewContext('leerFormulario()', contexto)).toBeNull();
    expect(campos['error-calle'].textContent).toBe('Este campo es requerido');
    expect(campos['error-numero'].textContent).toBe('');
    campos.calle.value = 'Hidalgo';
    expect(runInNewContext('leerFormulario()', contexto)).toEqual({ calle: 'Hidalgo', numeroCasa: '10', colonia: 'Centro', idZona: 1 });
    expect(campos['error-calle'].textContent).toBe('');
  });
  it('impide continuar con una zona fuera de cobertura', () => {
    const { contexto } = formulario({ calle: 'Hidalgo', numero: '10', colonia: 'Centro', zona: 'fuera' });
    expect(runInNewContext('leerFormulario()', contexto)).toBeNull();
  });
});
