import type { DateOnly } from "./common";

export interface AforeBalancePoint {
  id: string;
  fecha: DateOnly;
  saldo: number;
}
