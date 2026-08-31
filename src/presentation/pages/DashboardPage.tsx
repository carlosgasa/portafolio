import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Wallet, TrendingUp, PiggyBank, Scale, Download, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/presentation/components/StatCard";
import { HideBalancesButton } from "@/presentation/components/HideBalancesButton";
import { Money } from "@/presentation/components/Money";
import { usePortfolioHistory } from "@/presentation/hooks/usePortfolioHistory";
import { useAforePortfolio } from "@/presentation/hooks/useAforePortfolio";
import { useInfonavitPortfolio } from "@/presentation/hooks/useInfonavitPortfolio";
import { useBolsaPortfolio } from "@/presentation/hooks/useBolsaPortfolio";
import { useCryptoPortfolio } from "@/presentation/hooks/useCryptoPortfolio";
import { useFinsusPortfolio } from "@/presentation/hooks/useFinsusPortfolio";
import { useYoTePrestoPortfolio } from "@/presentation/hooks/useYoTePrestoPortfolio";
import { useCuentas } from "@/presentation/hooks/useCuentas";
import { formatCurrency, formatPercent, formatShortDate } from "@/shared/utils/format";
import { currentWeekRange, today } from "@/shared/utils/dates";

/** Claves tal como las escribe la Cloud Function weeklySnapshot en porInstrumento. */
const RENDIMIENTO_INSTRUMENTS = [
  { key: "Bolsa", label: "Bolsa", color: "var(--chart-1)" },
  { key: "Criptos", label: "Cripto", color: "var(--chart-2)" },
  { key: "Finsus", label: "Finsus", color: "var(--chart-3)" },
  { key: "YoTePresto", label: "YoTePresto", color: "var(--chart-4)" },
];

/** Color fijo por instrumento (no por posicion en el arreglo, que se
 * reordena por valor): asi una porcion no cambia de color al variar montos. */
const INSTRUMENT_COLORS: Record<string, string> = {
  AFORE: "var(--chart-1)",
  Bolsa: "var(--chart-2)",
  Cripto: "var(--chart-3)",
  Finsus: "var(--chart-4)",
  YoTePresto: "var(--chart-5)",
};

/** Instrumentos para el area apilada de balances historicos (incluye AFORE,
 * a diferencia de RENDIMIENTO_INSTRUMENTS, porque su balance si tiene
 * sentido graficar aunque no se pueda medir rendimiento). Colores
 * consistentes con INSTRUMENT_COLORS (usados en la grafica de pastel). */
const BALANCE_INSTRUMENTS = [
  { key: "AFORE", label: "AFORE", color: INSTRUMENT_COLORS.AFORE },
  { key: "Bolsa", label: "Bolsa", color: INSTRUMENT_COLORS.Bolsa },
  { key: "Criptos", label: "Cripto", color: INSTRUMENT_COLORS.Cripto },
  { key: "Finsus", label: "Finsus", color: INSTRUMENT_COLORS.Finsus },
  { key: "YoTePresto", label: "YoTePresto", color: INSTRUMENT_COLORS.YoTePresto },
];

export function DashboardPage() {
  const { data, isLoading } = usePortfolioHistory();
  const afore = useAforePortfolio();
  const infonavit = useInfonavitPortfolio();
  const bolsa = useBolsaPortfolio();
  const cripto = useCryptoPortfolio();
  const finsus = useFinsusPortfolio();
  const yotepresto = useYoTePrestoPortfolio();
  const cuentas = useCuentas();

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

  const pieData = breakdownData.filter((d) => d.valor > 0);

  const valorTotalLive = breakdownData.reduce((s, d) => s + d.valor, 0);
  const aporteTotalLive = breakdownData.reduce((s, d) => s + d.aporte, 0);
  const rendimientoLive =
    aporteTotalLive !== 0 ? (valorTotalLive - aporteTotalLive) / Math.abs(aporteTotalLive) : 0;

  const cuentasData = cuentas.query.data;
  const infonavitAdeudo = infonavit.latest?.saldo ?? 0;
  const patrimonioNeto =
    valorTotalLive +
    (cuentasData?.totalLiquidez ?? 0) +
    (cuentasData?.totalMeDeben ?? 0) -
    (cuentasData?.totalTarjetasPendiente ?? 0) -
    infonavitAdeudo;

  const { start: weekStart, end: weekEnd } = currentWeekRange();
  const pagosSemana = (cuentasData?.cards ?? [])
    .flatMap((c) => c.pagos)
    .filter((p) => !p.pagado && p.fecha >= weekStart && p.fecha <= weekEnd)
    .reduce((s, p) => s + p.monto, 0);
  const liquidezInsuficiente =
    !cuentas.query.isLoading && pagosSemana > 0 && pagosSemana > (cuentasData?.totalLiquidez ?? 0);

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

  const balanceData = snapshotsConDesglose.map((s) => {
    const entry: { fecha: string; label: string } & Record<string, number | string> = {
      fecha: s.fecha,
      label: formatShortDate(s.fecha),
    };
    for (const { key } of BALANCE_INSTRUMENTS) {
      entry[key] = s.porInstrumento[key]?.valor ?? 0;
    }
    return entry;
  });

  function handleExport() {
    const csv = buildDashboardReportCsv({
      valorTotal: valorTotalLive,
      aporteTotal: aporteTotalLive,
      rendimiento: rendimientoLive,
      patrimonioNeto,
      infonavitAdeudo,
      breakdown: breakdownData,
      history: chartData,
    });
    downloadCsv(`reporte-portafolio-${today()}.csv`, csv);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Resumen general del portafolio
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Scale className="size-3.5" />
            Patrimonio neto:{" "}
            <span className="font-mono tabular-nums text-foreground">
              <Money value={patrimonioNeto} decimals={2} />
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-4" />
            Exportar
          </Button>
          <HideBalancesButton />
        </div>
      </div>

      {liquidezInsuficiente && (
        <div className="flex items-center gap-3 rounded-lg border border-negative/40 bg-negative/10 px-4 py-3 text-sm text-foreground">
          <AlertTriangle className="size-4 shrink-0 text-negative" />
          <p>
            Tus pagos de tarjeta de esta semana ({formatCurrency(pagosSemana, 2)}) superan tu
            liquidez disponible ({formatCurrency(cuentasData?.totalLiquidez ?? 0, 2)}).{" "}
            <Link to="/cuentas" className="underline underline-offset-2">
              Ver Cuentas
            </Link>
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {breakdownLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <StatCard
              label="Valor total"
              value={formatCurrency(valorTotalLive, 2)}
              icon={Wallet}
            />
            <StatCard
              label="Aporte total"
              value={formatCurrency(aporteTotalLive, 2)}
              icon={PiggyBank}
              gradient="cyan"
            />
            <StatCard
              label="Rendimiento"
              value={formatPercent(rendimientoLive)}
              icon={TrendingUp}
              tone={rendimientoLive >= 0 ? "positive" : "negative"}
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
              <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="gradValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradAporte" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Area
                  type="monotone"
                  dataKey="valor"
                  name="Valor"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  fill="url(#gradValor)"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="aporte"
                  name="Aporte"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  fill="url(#gradAporte)"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
          {chartData.length > 0 && <ChartLegend />}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Balance por instrumento (histórico)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : balanceData.length === 0 ? (
            <div className="flex h-72 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <p>Todavía no hay historial por instrumento.</p>
              <p>
                Se va guardando cada semana a partir de ahora, junto con el
                snapshot general.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={288}>
              <AreaChart data={balanceData} margin={{ left: 8, right: 8 }}>
                <defs>
                  {BALANCE_INSTRUMENTS.map((inst) => (
                    <linearGradient key={inst.key} id={`gradBalance-${inst.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={inst.color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={inst.color} stopOpacity={0.25} />
                    </linearGradient>
                  ))}
                </defs>
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
                  width={64}
                  tickFormatter={(v: number) =>
                    new Intl.NumberFormat("es-MX", {
                      notation: "compact",
                      compactDisplay: "short",
                    }).format(v)
                  }
                />
                <Tooltip content={<StackedBalanceTooltip />} />
                {BALANCE_INSTRUMENTS.map((inst) => (
                  <Area
                    key={inst.key}
                    type="monotone"
                    dataKey={inst.key}
                    name={inst.label}
                    stackId="balance"
                    stroke={inst.color}
                    fill={`url(#gradBalance-${inst.key})`}
                    strokeWidth={1.5}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
          {balanceData.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              {BALANCE_INSTRUMENTS.map((inst) => (
                <span key={inst.key} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: inst.color }} />
                  {inst.label}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/60 lg:col-span-2">
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
                  <defs>
                    <linearGradient id="gradBarValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={1} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                    </linearGradient>
                    <linearGradient id="gradBarAporte" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={1} />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.45} />
                    </linearGradient>
                  </defs>
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
                  <Bar dataKey="valor" name="Valor" fill="url(#gradBarValor)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="aporte" name="Aporte" fill="url(#gradBarAporte)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
            <ChartLegend />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Distribución del portafolio</CardTitle>
          </CardHeader>
          <CardContent>
            {breakdownLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : pieData.length === 0 ? (
              <div className="flex h-72 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <p>Todavía no hay datos en ningún instrumento.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={288}>
                <PieChart>
                  <Tooltip content={<PieChartTooltip total={valorTotalLive} />} />
                  <Pie
                    data={pieData}
                    dataKey="valor"
                    nameKey="instrumento"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    strokeWidth={2}
                    stroke="var(--card)"
                    label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.instrumento} fill={INSTRUMENT_COLORS[entry.instrumento]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
            {pieData.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                {pieData.map((d) => (
                  <span key={d.instrumento} className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: INSTRUMENT_COLORS[d.instrumento] }}
                    />
                    {d.instrumento}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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

function StackedBalanceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, item) => s + item.value, 0);
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {[...payload].reverse().map((item) => (
        <div key={item.dataKey} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: item.color }} />
          <span className="text-muted-foreground">{item.name}:</span>
          <span className="font-mono tabular-nums text-foreground">
            {formatCurrency(item.value)}
          </span>
        </div>
      ))}
      <div className="mt-1 flex items-center gap-2 border-t border-border pt-1">
        <span className="text-muted-foreground">Total:</span>
        <span className="font-mono tabular-nums text-foreground">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

function PieChartTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const pct = total !== 0 ? item.value / total : 0;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: INSTRUMENT_COLORS[item.name] }} />
        <span className="font-medium text-foreground">{item.name}</span>
      </div>
      <p className="mt-1 font-mono tabular-nums text-foreground">
        {formatCurrency(item.value)} ({formatPercent(pct)})
      </p>
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

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function buildDashboardReportCsv(params: {
  valorTotal: number;
  aporteTotal: number;
  rendimiento: number;
  patrimonioNeto: number;
  infonavitAdeudo: number;
  breakdown: { instrumento: string; valor: number; aporte: number }[];
  history: { fecha: string; valor: number; aporte: number }[];
}): string {
  const lines: string[] = [];
  lines.push("Reporte de portafolio");
  lines.push(`Generado,${today()}`);
  lines.push("");
  lines.push("Resumen");
  lines.push("Concepto,Monto");
  lines.push(`Valor total,${params.valorTotal.toFixed(2)}`);
  lines.push(`Aporte total,${params.aporteTotal.toFixed(2)}`);
  lines.push(`Rendimiento,${(params.rendimiento * 100).toFixed(2)}%`);
  lines.push(`Adeudo Infonavit,${params.infonavitAdeudo.toFixed(2)}`);
  lines.push(`Patrimonio neto,${params.patrimonioNeto.toFixed(2)}`);
  lines.push("");
  lines.push("Por instrumento");
  lines.push("Instrumento,Valor,Aporte");
  for (const b of params.breakdown) {
    lines.push(`${csvEscape(b.instrumento)},${b.valor.toFixed(2)},${b.aporte.toFixed(2)}`);
  }
  lines.push("");
  lines.push("Histórico semanal");
  lines.push("Fecha,Valor,Aporte");
  for (const h of params.history) {
    lines.push(`${h.fecha},${h.valor.toFixed(2)},${h.aporte.toFixed(2)}`);
  }
  return lines.join("\n");
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
