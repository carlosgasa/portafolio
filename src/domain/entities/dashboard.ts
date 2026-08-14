import type { DateOnly } from "./common";

export interface InstrumentSnapshot {
  aporte: number;
  valor: number;
}

export interface PortfolioSnapshot {
  fecha: DateOnly;
  aporteTotal: number;
  valorTotal: number;
  rendimiento: number;
  porInstrumento: Record<string, InstrumentSnapshot>;
}
