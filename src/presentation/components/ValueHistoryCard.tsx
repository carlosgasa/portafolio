import { useState, type FormEvent } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Plus, Pencil, Check, X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { AmountInput } from "@/components/ui/amount-input";
import { DeleteButton } from "@/presentation/components/DeleteButton";
import { Money } from "@/presentation/components/Money";
import { useHiddenBalances } from "@/presentation/hooks/useHiddenBalances";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { evalAmountExpression } from "@/shared/utils/evalAmountExpression";
import { formatCurrency, formatShortDate } from "@/shared/utils/format";
import { addMonths, today } from "@/shared/utils/dates";

export interface ValuePoint {
  id: string;
  fecha: string;
  valor: number;
}

interface ChartPoint {
  fecha: string;
  label: string;
  valor?: number | null;
  proyeccion?: number | null;
}

/** Regresion lineal simple (minimos cuadrados) sobre puntos {x,y}. */
function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

const DAY_MS = 86_400_000;

/** Proyecta `months` meses hacia adelante ajustando una recta de tendencia
 * sobre el historico completo (no solo los dos ultimos puntos, para no ser
 * tan sensible a un salto puntual). */
function projectPoints(sorted: ValuePoint[], months: number): ChartPoint[] {
  if (sorted.length < 2 || months <= 0) return [];
  const firstMs = new Date(`${sorted[0].fecha}T00:00:00`).getTime();
  const { slope, intercept } = linearRegression(
    sorted.map((p) => ({
      x: (new Date(`${p.fecha}T00:00:00`).getTime() - firstMs) / DAY_MS,
      y: p.valor,
    })),
  );
  const lastFecha = sorted[sorted.length - 1].fecha;
  const points: ChartPoint[] = [];
  for (let m = 1; m <= months; m++) {
    const fecha = addMonths(lastFecha, m);
    const x = (new Date(`${fecha}T00:00:00`).getTime() - firstMs) / DAY_MS;
    points.push({ fecha, label: formatShortDate(fecha), proyeccion: slope * x + intercept });
  }
  return points;
}

interface ValueHistoryCardProps {
  points: ValuePoint[];
  isLoading: boolean;
  valueLabel: string;
  onAdd: (point: { fecha: string; valor: number }) => Promise<unknown>;
  onUpdate: (id: string, patch: { fecha: string; valor: number }) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function ValueHistoryCard({
  points,
  isLoading,
  valueLabel,
  onAdd,
  onUpdate,
  onDelete,
}: ValueHistoryCardProps) {
  const [open, setOpen] = useState(false);
  const { isHidden } = useHiddenBalances();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFecha, setEditFecha] = useState("");
  const [editValor, setEditValor] = useState("");
  const [projectMonths, setProjectMonths] = useState(12);
  const sorted = [...points].sort((a, b) => a.fecha.localeCompare(b.fecha));

  const canProject = sorted.length >= 2;
  const showProjection = canProject && projectMonths > 0;
  const projected = showProjection ? projectPoints(sorted, projectMonths) : [];
  const chartData: ChartPoint[] = sorted.map((p, i) => ({
    fecha: p.fecha,
    label: formatShortDate(p.fecha),
    valor: p.valor,
    // Punto puente: el ultimo real tambien lleva "proyeccion" con el mismo
    // valor, para que la linea punteada arranque justo donde termina la solida.
    proyeccion: showProjection && i === sorted.length - 1 ? p.valor : null,
  }));
  const combinedData = showProjection ? [...chartData, ...projected] : chartData;
  const lastProjected = projected.at(-1);

  function startEdit(p: ValuePoint) {
    setEditingId(p.id);
    setEditFecha(p.fecha);
    setEditValor(String(p.valor));
  }

  const editValorValue = evalAmountExpression(editValor);

  async function saveEdit() {
    if (!editingId || editValorValue === null) return;
    await onUpdate(editingId, { fecha: editFecha, valor: editValorValue });
    setEditingId(null);
  }

  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{valueLabel}</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="secondary">
              <Plus className="size-4" />
              Agregar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <PointForm
              valueLabel={valueLabel}
              onSubmit={async (p) => {
                await onAdd(p);
                setOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sin registros todavía.
          </p>
        ) : (
          <>
            {canProject && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="size-3.5" />
                <label htmlFor="project-months">Proyectar</label>
                <Input
                  id="project-months"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={60}
                  value={projectMonths}
                  onChange={(e) =>
                    setProjectMonths(Math.max(0, Math.min(60, Number(e.target.value) || 0)))
                  }
                  className="h-7 w-16 px-2 text-center"
                />
                <span>
                  meses (recta de tendencia sobre tu histórico){lastProjected && (
                    <>
                      {" · en "}
                      {projectMonths}
                      {" meses: "}
                      <span className="font-mono tabular-nums text-foreground">
                        {isHidden ? "••••••" : formatCurrency(lastProjected.proyeccion ?? 0)}
                      </span>
                    </>
                  )}
                </span>
              </div>
            )}
            <ResponsiveContainer width="100%" height={224}>
              <AreaChart data={combinedData} margin={{ left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="gradValueHistory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
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
                    isHidden
                      ? "•••"
                      : new Intl.NumberFormat("es-MX", {
                          notation: "compact",
                          compactDisplay: "short",
                        }).format(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                  itemStyle={{ color: "var(--foreground)" }}
                  formatter={(value, name) => [isHidden ? "••••••" : formatCurrency(Number(value)), name]}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  name={valueLabel}
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  fill="url(#gradValueHistory)"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                {showProjection && (
                  <Area
                    type="monotone"
                    dataKey="proyeccion"
                    name="Proyección"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    strokeLinecap="round"
                    fill="none"
                    dot={false}
                    activeDot={{ r: 4 }}
                    connectNulls
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}

        {sorted.length > 0 && (
          <ul className="flex max-h-48 flex-col divide-y divide-border/60 overflow-y-auto">
            {[...sorted].reverse().map((p) =>
              editingId === p.id ? (
                <li key={p.id} className="flex items-end gap-2 py-2">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label htmlFor={`vh-fecha-${p.id}`} className="text-xs">
                      Fecha
                    </Label>
                    <DatePicker id={`vh-fecha-${p.id}`} value={editFecha} onChange={setEditFecha} />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label htmlFor={`vh-valor-${p.id}`} className="text-xs">
                      {valueLabel}
                    </Label>
                    <AmountInput id={`vh-valor-${p.id}`} value={editValor} onChange={setEditValor} />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-positive hover:text-positive"
                    aria-label="Guardar"
                    disabled={editValorValue === null}
                    onClick={saveEdit}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Cancelar"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </li>
              ) : (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-foreground">{formatShortDate(p.fecha)}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono tabular-nums text-foreground">
                      <Money value={p.valor} />
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label="Editar"
                      onClick={() => startEdit(p)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <DeleteButton onConfirm={() => onDelete(p.id)} />
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function PointForm({
  valueLabel,
  onSubmit,
}: {
  valueLabel: string;
  onSubmit: (point: { fecha: string; valor: number }) => Promise<void>;
}) {
  const [fecha, setFecha] = useState(() => today());
  const [valor, setValor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const valorValue = evalAmountExpression(valor);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (valorValue === null) return;
    setSubmitting(true);
    try {
      await onSubmit({ fecha, valor: valorValue });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Nuevo registro</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="vp-fecha">Fecha</Label>
        <DatePicker id="vp-fecha" value={fecha} onChange={setFecha} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="vp-valor">{valueLabel} (MXN)</Label>
        <AmountInput id="vp-valor" required value={valor} onChange={setValor} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting || valorValue === null}>
          {submitting ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
