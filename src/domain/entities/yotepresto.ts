import type { DateOnly } from "./common";

export interface AccountValuePoint {
  id: string;
  fecha: DateOnly;
  valorCuenta: number;
}
