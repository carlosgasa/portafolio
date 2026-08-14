import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Wallet, TrendingUp, PiggyBank } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/presentation/components/StatCard";
import { usePortfolioHistory } from "@/presentation/hooks/usePortfolioHistory";
import { formatCurrency, formatPercent, formatShortDate } from "@/shared/utils/format";

export function DashboardPage() {
  const { data, isLoading } = usePortfolioHistory();

  const latest = data?.latest;
  const chartData = (data?.snapshots ?? []).map((s) => ({
    fecha: s.fecha,
    label: formatShortDate(s.fecha),
    aporte: s.aporteTotal,
    valor: s.valorTotal,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen general del portafolio
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <StatCard
              label="Valor total"
              value={latest ? formatCurrency(latest.valorTotal) : "—"}
              icon={Wallet}
            />
            <StatCard
              label="Aporte total"
              value={latest ? formatCurrency(latest.aporteTotal) : "—"}
              icon={PiggyBank}
            />
            <StatCard
              label="Rendimiento"
              value={latest ? formatPercent(latest.rendimiento) : "—"}
              icon={TrendingUp}
              tone={
                latest && latest.rendimiento >= 0 ? "positive" : "negative"
              }
            />
          </>
        )}
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Histórico semanal</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : chartData.length === 0 ? (
            <div className="flex h-72 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <p>Todavía no hay snapshots del portafolio.</p>
              <p>
                Se generan automáticamente cada semana, o se importan desde tu
                histórico.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={288}>
              <LineChart data={chartData} margin={{ left: 8, right: 8 }}>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="label"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={32}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tickFormatter={(v: number) =>
                    new Intl.NumberFormat("es-MX", {
                      notation: "compact",
                      compactDisplay: "short",
                    }).format(v)
                  }
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="valor"
                  name="Valor"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="aporte"
                  name="Aporte"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          {chartData.length > 0 && <ChartLegend />}
        </CardContent>
      </Card>
    </div>
  );
}

function ChartLegend() {
  return (
    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ background: "var(--chart-1)" }} />
        Valor
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ background: "var(--chart-2)" }} />
        Aporte
      </span>
    </div>
  );
}

interface TooltipPayloadItem {
  dataKey: string;
  name: string;
  value: number;
  color: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ background: item.color }}
          />
          <span className="text-muted-foreground">{item.name}:</span>
          <span className="font-mono tabular-nums text-foreground">
            {formatCurrency(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
