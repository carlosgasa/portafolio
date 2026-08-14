import type { DateOnly } from "./common";

export interface StockHolding {
  id: string;
  ticker: string;
  nombre: string;
  cantidad: number;
  costoTotal: number;
}

/** Ultimo precio conocido de un ticker (captura manual). */
export interface StockPrice {
  ticker: string;
  precio: number;
  fecha: DateOnly;
}
