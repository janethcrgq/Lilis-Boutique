export type MetodoEntrega = 'DOMICILIO' | 'RECOGER_EN_BOUTIQUE';

export type EstadoEnvio = 'PREPARANDO' | 'EN_CAMINO' | 'ENTREGADO';

export interface Envio {
  idEnvio: number;
  idPedido: number;
  idDireccion: number;
  linkSeguimiento: string | null;
  nombreRepartidor: string | null;
  placas: string | null;
  costoEnvio: number;
  estadoEnvio: EstadoEnvio;
}
