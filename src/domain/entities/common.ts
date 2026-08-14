/** Fecha en formato ISO (YYYY-MM-DD), sin hora. */
export type DateOnly = string;

/** Movimiento generico de aporte/retiro que usan varios instrumentos. */
export interface Movement {
  id: string;
  fecha: DateOnly;
  monto: number;
  nota?: string;
}
