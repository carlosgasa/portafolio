import { useState, type FormEvent } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { DeleteButton } from "@/presentation/components/DeleteButton";
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
  onDelete: (id: string) => Promise<unknown>;
}

export function ValueHistoryCard({
  points,
  isLoading,
  valueLabel,
  onAdd,
  onDelete,
}: ValueHistoryCardProps) {
  const [open, setOpen] = useState(false);
  const sorted = [...points].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const chartData = sorted.map((p) => ({ ...p, label: formatShortDate(p.fecha) }));

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
            <LineChart data={chartData} margin={{ left: 8, right: 8 }}>
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
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--foreground)" }}
                formatter={(value) => [formatCurrency(Number(value)), valueLabel]}
              />
              <Line
                type="monotone"
                dataKey="valor"
                name={valueLabel}
                stroke="var(--chart-1)"
                strokeWidth={2}
                strokeLinecap="round"
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {sorted.length > 0 && (
          <ul className="flex max-h-48 flex-col divide-y divide-border/60 overflow-y-auto">
            {[...sorted].reverse().map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-foreground">{formatShortDate(p.fecha)}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono tabular-nums text-foreground">
                    {formatCurrency(p.valor)}
                  </span>
                  <DeleteButton onConfirm={() => onDelete(p.id)} />
                </div>
              </li>
            ))}
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ fecha, valor: Number(valor) });
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
        <Input
          id="vp-valor"
          type="number"
          step="any"
          required
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
