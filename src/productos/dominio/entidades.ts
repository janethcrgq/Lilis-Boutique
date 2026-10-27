// Una variante es una talla y un color del producto, con su existencia.
export interface Variante {
  idVariante: number;
  talla: string;
  color: string;
  imagenURL: string | null;
  // Stock menos lo que tienen apartado las clientas en este momento.
  disponibles: number;
}

export interface Producto {
  idProducto: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string;
  variantes: Variante[];
}
