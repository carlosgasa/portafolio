import {
  Bar,
  BarChart,
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
import { HideBalancesButton } from "@/presentation/components/HideBalancesButton";
import { usePortfolioHistory } from "@/presentation/hooks/usePortfolioHistory";
import { useAforePortfolio } from "@/presentation/hooks/useAforePortfolio";
import { useBolsaPortfolio } from "@/presentation/hooks/useBolsaPortfolio";
import { useCryptoPortfolio } from "@/presentation/hooks/useCryptoPortfolio";
import { useFinsusPortfolio } from "@/presentation/hooks/useFinsusPortfolio";
import { useYoTePrestoPortfolio } from "@/presentation/hooks/useYoTePrestoPortfolio";
import { formatCurrency, formatPercent, formatShortDate } from "@/shared/utils/format";

/** Claves tal como las escribe la Cloud Function weeklySnapshot en porInstrumento. */
const RENDIMIENTO_INSTRUMENTS = [
  { key: "Bolsa", label: "Bolsa", color: "var(--chart-1)" },
  { key: "Criptos", label: "Cripto", color: "var(--chart-2)" },
  { key: "Finsus", label: "Finsus", color: "var(--chart-3)" },
  { key: "YoTePresto", label: "YoTePresto", color: "var(--chart-4)" },
];

export function DashboardPage() {
  const { data, isLoading } = usePortfolioHistory();
  const afore = useAforePortfolio();
  const bolsa = useBolsaPortfolio();
  const cripto = useCryptoPortfolio();
  const finsus = useFinsusPortfolio();
  const yotepresto = useYoTePrestoPortfolio();

  const latest = data?.latest;
  const chartData = (data?.snapshots ?? []).map((s) => ({
    fecha: s.fecha,
    label: formatShortDate(s.fecha),
    aporte: s.aporteTotal,
    valor: s.valorTotal,
  }));

  const breakdownLoading =
    afore.query.isLoading ||
    bolsa.query.isLoading ||
    cripto.query.isLoading ||
    finsus.query.isLoading ||
    yotepresto.query.isLoading;

  const breakdownData = [
    { instrumento: "AFORE", valor: afore.latest?.saldo ?? 0, aporte: 0 },
    {
      instrumento: "Bolsa",
      valor: bolsa.query.data?.valorTotal ?? 0,
      aporte: bolsa.query.data?.aporteTotal ?? 0,
    },
    {
      instrumento: "Cripto",
      valor: cripto.query.data?.valorTotal ?? 0,
      aporte: cripto.query.data?.aporteTotal ?? 0,
    },
    {
      instrumento: "Finsus",
      valor: finsus.query.data?.valorTotal ?? 0,
      aporte: finsus.query.data?.aporteTotal ?? 0,
    },
    {
      instrumento: "YoTePresto",
      valor: yotepresto.query.data?.valorTotal ?? 0,
      aporte: yotepresto.query.data?.aporteTotal ?? 0,
    },
  ].sort((a, b) => b.valor - a.valor);

  const snapshotsConDesglose = (data?.snapshots ?? []).filter(
    (s) => s.porInstrumento && Object.keys(s.porInstrumento).length > 0,
  );
  const rendimientoData = snapshotsConDesglose.map((s) => {
    const entry: { fecha: string; label: string } & Record<string, number | null | string> = {
      fecha: s.fecha,
      label: formatShortDate(s.fecha),
    };
    for (const { key } of RENDIMIENTO_INSTRUMENTS) {
      const inst = s.porInstrumento[key];
      entry[key] = inst && inst.aporte !== 0 ? (inst.valor - inst.aporte) / Math.abs(inst.aporte) : null;
    }
    return entry;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Resumen general del portafolio
          </p>
        </div>
        <HideBalancesButton />
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
              gradient="cyan"
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

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Valor y aporte por instrumento</CardTitle>
        </CardHeader>
        <CardContent>
          {breakdownLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : breakdownData.every((d) => d.valor === 0 && d.aporte === 0) ? (
            <div className="flex h-72 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <p>Todavía no hay datos en ningún instrumento.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={288}>
              <BarChart data={breakdownData} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="instrumento"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
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
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
                <Bar dataKey="valor" name="Valor" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="aporte" name="Aporte" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <ChartLegend />
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Rendimiento por instrumento</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : rendimientoData.length === 0 ? (
            <div className="flex h-72 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <p>Todavía no hay historial por instrumento.</p>
              <p>
                Se va guardando cada semana a partir de ahora, junto con el
                snapshot general.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={288}>
              <LineChart data={rendimientoData} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
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
                  width={56}
                  tickFormatter={(v: number) => formatPercent(v)}
                />
                <Tooltip content={<PercentChartTooltip />} />
                {RENDIMIENTO_INSTRUMENTS.map((inst) => (
                  <Line
                    key={inst.key}
                    type="monotone"
                    dataKey={inst.key}
                    name={inst.label}
                    stroke={inst.color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    dot={false}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
          {rendimientoData.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              {RENDIMIENTO_INSTRUMENTS.map((inst) => (
                <span key={inst.key} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: inst.color }} />
                  {inst.label}
                </span>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            AFORE no aparece aquí: como los aportes los hace el patrón (no tú),
            no hay contra qué medir rendimiento — su valor lo puedes ver en su
            propia página.
          </p>
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

function PercentChartTooltip({
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
          <span className="size-2 rounded-full" style={{ background: item.color }} />
          <span className="text-muted-foreground">{item.name}:</span>
          <span className="font-mono tabular-nums text-foreground">
            {formatPercent(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
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
