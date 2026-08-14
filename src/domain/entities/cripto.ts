import type { DateOnly } from "./common";

export interface CryptoHolding {
  id: string;
  symbol: string;
  nombre: string;
  cantidad: number;
  costoPromedio: number;
}

export interface CryptoPricePoint {
  fecha: DateOnly;
  precioUsd: number;
  precioMxn: number;
}
