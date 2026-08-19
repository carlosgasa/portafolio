import type { DateOnly } from "./common";

/** Saldo de adeudo del credito Infonavit en una fecha dada (registro manual
 * mensual, igual que AforeBalancePoint). */
export interface InfonavitBalancePoint {
  id: string;
  fecha: DateOnly;
  saldo: number;
}
