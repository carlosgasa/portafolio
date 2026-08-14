import type { DateOnly } from "./common";

export interface StockHolding {
  id: string;
  ticker: string;
  nombre: string;
  cantidad: number;
  costoPromedio: number;
}

export interface StockPricePoint {
  id: string;
  ticker: string;
  fecha: DateOnly;
  precio: number;
}
