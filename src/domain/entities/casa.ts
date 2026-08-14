import type { DateOnly } from "./common";

export interface ExpenseItem {
  id: string;
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  fecha: DateOnly;
}
