import { ResultadoPasarela } from './entidades';

// La pasarela de pagos externa. El sistema nunca ve los datos de la
// tarjeta: solo recibe el token que genera la pasarela (PCI-DSS).
export interface PasarelaPagos {
  cobrar(monto: number, tokenTarjeta: string): Promise<ResultadoPasarela>;
}
