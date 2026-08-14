import type { DateOnly } from "./common";

export interface FixedTermAccount {
  id: string;
  cuenta: string;
  saldo: number;
  /** Tasa anual (%). El pago mensual se calcula como saldo * tasa/100 / 12. */
  tasa: number;
  fechaApertura: DateOnly;
  fechaVencimiento: DateOnly;
  /** Ya vencio y no cuenta en el total (igual que marcarlo como texto en el Excel). */
  vencida?: boolean;
}
