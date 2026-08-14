import type { DateOnly } from "./common";

export interface FixedTermAccount {
  id: string;
  cuenta: string;
  saldo: number;
  tasa: number;
  plazo: string;
  fechaApertura: DateOnly;
  fechaVencimiento: DateOnly;
}
