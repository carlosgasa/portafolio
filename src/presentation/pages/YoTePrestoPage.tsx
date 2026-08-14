import { HandCoins, Wallet, PiggyBank, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/presentation/components/StatCard";
import { MovementsList } from "@/presentation/components/MovementsList";
import { ValueHistoryCard } from "@/presentation/components/ValueHistoryCard";
import { useYoTePrestoPortfolio } from "@/presentation/hooks/useYoTePrestoPortfolio";
import { formatCurrency, formatPercent } from "@/shared/utils/format";

export function YoTePrestoPage() {
  const { query, addValue, deleteValue, addMovement, deleteMovement } =
    useYoTePrestoPortfolio();
  const data = query.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          <HandCoins className="size-6 text-primary" />
          YoTePresto
        </h1>
        <p className="text-sm text-muted-foreground">
          Valor de cuenta y movimientos
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {query.isLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <StatCard label="Valor actual" value={formatCurrency(data?.valorTotal ?? 0)} icon={Wallet} />
            <StatCard
              label="Aporte total"
              value={formatCurrency(data?.aporteTotal ?? 0)}
              icon={PiggyBank}
            />
            <StatCard
              label="Rendimiento"
              value={formatPercent(data?.rendimiento ?? 0)}
              icon={TrendingUp}
              tone={(data?.rendimiento ?? 0) >= 0 ? "positive" : "negative"}
            />
          </>
        )}
      </div>

      <ValueHistoryCard
        points={(data?.values ?? []).map((v) => ({ id: v.id, fecha: v.fecha, valor: v.valorCuenta }))}
        isLoading={query.isLoading}
        valueLabel="Valor de cuenta"
        onAdd={(p) => addValue.mutateAsync({ fecha: p.fecha, valorCuenta: p.valor })}
        onDelete={(id) => deleteValue.mutateAsync(id)}
      />

      <MovementsList
        movements={data?.movements ?? []}
        onAdd={(m) => addMovement.mutateAsync(m)}
        onDelete={(id) => deleteMovement.mutateAsync(id)}
      />
    </div>
  );
}
