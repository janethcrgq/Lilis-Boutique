export interface ZonaEnvio {
  idZona: number;
  nombre: string;
  costoEnvio: number;
}

export interface Direccion {
  idDireccion: number;
  idCliente: number;
  idZona: number;
  calle: string;
  numeroCasa: string;
  colonia: string;
  referencias: string | null;
  zona: ZonaEnvio;
}

export type NuevaDireccion = Omit<Direccion, 'idDireccion' | 'zona'>;
