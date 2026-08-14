import { PiggyBank, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/presentation/components/StatCard";
import { ValueHistoryCard } from "@/presentation/components/ValueHistoryCard";
import { useAforePortfolio } from "@/presentation/hooks/useAforePortfolio";
import { formatCurrency } from "@/shared/utils/format";

export function AforePage() {
  const { query, addBalance, deleteBalance, latest } = useAforePortfolio();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          <PiggyBank className="size-6 text-primary" />
          AFORE
        </h1>
        <p className="text-sm text-muted-foreground">Saldo histórico mensual</p>
      </div>

      <div className="grid gap-4 sm:max-w-xs">
        {query.isLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <StatCard label="Saldo actual" value={formatCurrency(latest?.saldo ?? 0)} icon={Wallet} />
        )}
      </div>

      <ValueHistoryCard
        points={(query.data ?? []).map((v) => ({ id: v.id, fecha: v.fecha, valor: v.saldo }))}
        isLoading={query.isLoading}
        valueLabel="Saldo AFORE"
        onAdd={(p) => addBalance.mutateAsync({ fecha: p.fecha, saldo: p.valor })}
        onDelete={(id) => deleteBalance.mutateAsync(id)}
      />
    </div>
  );
}
