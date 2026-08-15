import { PiggyBank, Wallet, CalendarClock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/presentation/components/StatCard";
import { ValueHistoryCard } from "@/presentation/components/ValueHistoryCard";
import { HideBalancesButton } from "@/presentation/components/HideBalancesButton";
import { useAforePortfolio } from "@/presentation/hooks/useAforePortfolio";
import { formatCurrency, formatPercent } from "@/shared/utils/format";

export function AforePage() {
  const { query, addBalance, updateBalance, deleteBalance, latest, previous } =
    useAforePortfolio();

  const crecimientoPeriodo = latest && previous ? latest.saldo - previous.saldo : null;
  const crecimientoPeriodoPct =
    crecimientoPeriodo !== null && previous && previous.saldo !== 0
      ? crecimientoPeriodo / Math.abs(previous.saldo)
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <PiggyBank className="size-6 text-primary" />
            AFORE
          </h1>
          <p className="text-sm text-muted-foreground">Saldo histórico mensual</p>
        </div>
        <HideBalancesButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {query.isLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <StatCard label="Saldo actual" value={formatCurrency(latest?.saldo ?? 0)} icon={Wallet} />
            <StatCard
              label="Último período"
              value={
                crecimientoPeriodo !== null
                  ? `${formatCurrency(crecimientoPeriodo)} (${formatPercent(crecimientoPeriodoPct ?? 0)})`
                  : "—"
              }
              icon={CalendarClock}
              gradient="purple"
              tone={crecimientoPeriodo === null ? "default" : crecimientoPeriodo >= 0 ? "positive" : "negative"}
            />
          </>
        )}
      </div>

      <ValueHistoryCard
        points={(query.data ?? []).map((v) => ({ id: v.id, fecha: v.fecha, valor: v.saldo }))}
        isLoading={query.isLoading}
        valueLabel="Saldo AFORE"
        onAdd={(p) => addBalance.mutateAsync({ fecha: p.fecha, saldo: p.valor })}
        onUpdate={(id, p) => updateBalance.mutateAsync({ id, patch: { fecha: p.fecha, saldo: p.valor } })}
        onDelete={(id) => deleteBalance.mutateAsync(id)}
      />
    </div>
  );
}
