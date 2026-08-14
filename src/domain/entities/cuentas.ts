import type { DateOnly } from "./common";

export interface CreditCard {
  id: string;
  nombre: string;
  gastoMesActual: number;
}

export interface CardPayment {
  id: string;
  fecha: DateOnly;
  monto: number;
  pagado: boolean;
}

export interface Person {
  id: string;
  nombre: string;
}

export type DebtType = "simple" | "cuotas";

export interface Debt {
  id: string;
  tipo: DebtType;
  descripcion: string;
  montoTotal: number;
  fechaCreacion: DateOnly;
  numCuotas?: number;
  montoCuota?: number;
}

export interface Installment {
  id: string;
  numero: number;
  fecha: DateOnly;
  monto: number;
  pagada: boolean;
}

export type LiquidBalanceType = "ahorro" | "ingreso_esperado";

export interface LiquidBalance {
  id: string;
  nombre: string;
  monto: number;
  tipo: LiquidBalanceType;
  fecha: DateOnly;
}
