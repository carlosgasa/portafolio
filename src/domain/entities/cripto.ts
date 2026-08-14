import type { DateOnly } from "./common";

export interface CryptoHolding {
  id: string;
  symbol: string;
  nombre: string;
  cantidad: number;
  /** Lo que costo comprar esta posicion en total (no por unidad). */
  costoTotal: number;
}

/** Ultimo precio conocido de un simbolo (lo sobreescribe la Cloud Function diaria). */
export interface CryptoPrice {
  symbol: string;
  precioUsd: number;
  precioMxn: number;
  fecha: DateOnly;
}
