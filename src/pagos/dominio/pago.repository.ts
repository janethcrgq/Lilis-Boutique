import { DatosTarjeta, FormaPago, Pago, ResumenDelPedido } from './entidades';

export interface PagoRepository {
  buscarPorId(idPago: number): Promise<Pago | null>;
  buscarPendiente(idPedido: number): Promise<Pago | null>;
  buscarPorFolio(folio: string): Promise<Pago | null>;
  listarTransferenciasPendientes(): Promise<Pago[]>;
  crear(idPedido: number, metodo: FormaPago, monto: number): Promise<Pago>;
  aprobar(idPago: number, tarjeta?: DatosTarjeta): Promise<Pago>;
  rechazar(idPago: number, tarjeta: DatosTarjeta): Promise<Pago>;
  cancelar(idPago: number): Promise<void>;
  registrarComprobante(
    idPago: number,
    numeroReferencia: string,
    comprobanteURL: string,
  ): Promise<Pago>;
  listarTransferenciasPendientes(): Promise<Pago[]>;
  buscarUltimo(idPedido: number): Promise<Pago | null>;
  buscarResumen(idPedido: number): Promise<ResumenDelPedido | null>;
}
