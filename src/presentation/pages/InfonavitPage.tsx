import { Building2, Wallet, CalendarClock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/presentation/components/StatCard";
import { ValueHistoryCard } from "@/presentation/components/ValueHistoryCard";
import { HideBalancesButton } from "@/presentation/components/HideBalancesButton";
import { useInfonavitPortfolio } from "@/presentation/hooks/useInfonavitPortfolio";
import { formatCurrency, formatPercent } from "@/shared/utils/format";

export function InfonavitPage() {
  const { query, addBalance, updateBalance, deleteBalance, latest, previous } =
    useInfonavitPortfolio();

  const cambioPeriodo = latest && previous ? latest.saldo - previous.saldo : null;
  const cambioPeriodoPct =
    cambioPeriodo !== null && previous && previous.saldo !== 0
      ? cambioPeriodo / Math.abs(previous.saldo)
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <Building2 className="size-6 text-primary" />
            Infonavit
          </h1>
          <p className="text-sm text-muted-foreground">Adeudo histórico mensual</p>
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
            <StatCard label="Adeudo actual" value={formatCurrency(latest?.saldo ?? 0)} icon={Wallet} />
            <StatCard
              label="Último período"
              value={
                cambioPeriodo !== null
                  ? `${formatCurrency(cambioPeriodo)} (${formatPercent(cambioPeriodoPct ?? 0)})`
                  : "—"
              }
              icon={CalendarClock}
              gradient="purple"
              // Al reves que en AFORE: aqui es deuda, asi que bajar el
              // adeudo es lo positivo.
              tone={cambioPeriodo === null ? "default" : cambioPeriodo <= 0 ? "positive" : "negative"}
            />
          </>
        )}
      </div>

      <ValueHistoryCard
        points={(query.data ?? []).map((v) => ({ id: v.id, fecha: v.fecha, valor: v.saldo }))}
        isLoading={query.isLoading}
        valueLabel="Adeudo Infonavit"
        onAdd={(p) => addBalance.mutateAsync({ fecha: p.fecha, saldo: p.valor })}
        onUpdate={(id, p) => updateBalance.mutateAsync({ id, patch: { fecha: p.fecha, saldo: p.valor } })}
        onDelete={(id) => deleteBalance.mutateAsync(id)}
      />
    </div>
  );
}
