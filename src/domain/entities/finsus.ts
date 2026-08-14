import type { DateOnly } from "./common";

export interface FixedTermAccount {
  id: string;
  cuenta: string;
  saldo: number;
  tasa: number;
  plazo: string;
  fechaApertura: DateOnly;
  fechaVencimiento: DateOnly;
  /** Ya vencio y no cuenta en el total (igual que marcarlo como texto en el Excel). */
  vencida?: boolean;
}
