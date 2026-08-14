import type { DateOnly } from "./common";

export interface ExpenseItem {
  id: string;
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  /** Opcional: el historico importado del Excel no llevaba fecha por partida. */
  fecha?: DateOnly;
  /** Opcional: el historico importado tampoco traia categoria. */
  categoria?: string;
}
