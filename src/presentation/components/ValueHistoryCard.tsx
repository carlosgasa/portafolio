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
import { Plus, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export interface ValuePoint {
  id: string;
  fecha: string;
  valor: number;
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
  const sorted = [...points].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const chartData = sorted.map((p) => ({ ...p, label: formatShortDate(p.fecha) }));

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
          <ResponsiveContainer width="100%" height={224}>
            <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
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
                formatter={(value) => [isHidden ? "••••••" : formatCurrency(Number(value)), valueLabel]}
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
            </AreaChart>
          </ResponsiveContainer>
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
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
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
