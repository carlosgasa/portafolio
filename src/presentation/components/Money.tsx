import { useHiddenBalances } from "@/presentation/hooks/useHiddenBalances";
import { formatCurrency, formatPercent } from "@/shared/utils/format";

/** Muestra un monto en MXN, o lo enmascara si el usuario activo "Ocultar saldos". */
export function Money({ value, className }: { value: number; className?: string }) {
  const { isHidden } = useHiddenBalances();
  return <span className={className}>{isHidden ? "••••••" : formatCurrency(value)}</span>;
}

/** Igual que Money pero para porcentajes (rendimiento). */
export function Percent({ value, className }: { value: number; className?: string }) {
  const { isHidden } = useHiddenBalances();
  return <span className={className}>{isHidden ? "••••" : formatPercent(value)}</span>;
}
