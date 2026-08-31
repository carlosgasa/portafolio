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
import { Plus, Pencil, Banknote, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AmountInput } from "@/components/ui/amount-input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/presentation/components/StatCard";
import { DeleteButton } from "@/presentation/components/DeleteButton";
import { SnapshotHistory } from "@/presentation/components/SnapshotHistory";
import { Money } from "@/presentation/components/Money";
import { useHiddenBalances } from "@/presentation/hooks/useHiddenBalances";
import type { useCuentas } from "@/presentation/hooks/useCuentas";
import type {
  CuentasSnapshot,
  LiquidBalance,
  LiquidBalanceHistoryEntry,
  LiquidBalanceType,
} from "@/domain/entities/cuentas";
import { formatCurrency, formatShortDate } from "@/shared/utils/format";
import { evalAmountExpression } from "@/shared/utils/evalAmountExpression";
import { COLOR_PRESETS } from "@/shared/colorPresets";
import { cn } from "@/lib/utils";

type CuentasApi = ReturnType<typeof useCuentas>;

const TIPO_LABEL: Record<LiquidBalanceType, string> = {
  ahorro: "Ahorro",
  ingreso_esperado: "Ingreso esperado",
};

export function LiquidezTab({ api, balances, total, snapshots, history }: {
  api: CuentasApi;
  balances: LiquidBalance[];
  total: number;
  snapshots: CuentasSnapshot[];
  history: LiquidBalanceHistoryEntry[];
}) {
  const [dialogItem, setDialogItem] = useState<LiquidBalance | "new" | null>(null);
  const [historyItem, setHistoryItem] = useState<LiquidBalance | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <StatCard label="Disponible a corto plazo" value={formatCurrency(total)} icon={Banknote} gradient="purple" />
        <div className="flex items-center gap-2">
          <SnapshotHistory
            tipo="liquidez"
            label="liquidez"
            snapshots={snapshots}
            currentTotal={total}
            currentDetalle={balances
              .filter((b) => b.incluido !== false)
              .map((b) => ({ nombre: b.nombre, monto: b.monto }))}
            onTake={(s) => api.addSnapshot.mutateAsync(s)}
            onDelete={(id) => api.deleteSnapshot.mutateAsync(id)}
          />
          <Dialog open={dialogItem !== null} onOpenChange={(o) => !o && setDialogItem(null)}>
            <DialogTrigger asChild>
              <Button onClick={() => setDialogItem("new")}>
                <Plus className="size-4" />
                Registro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <LiquidForm
                initial={dialogItem !== "new" ? dialogItem : null}
                onSubmit={async (values) => {
                  if (dialogItem !== "new" && dialogItem) {
                    await api.updateLiquidBalance.mutateAsync({ id: dialogItem.id, patch: values });
                  } else {
                    await api.addLiquidBalance.mutateAsync(values);
                  }
                  setDialogItem(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {balances.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sin registros todavía.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border/60 rounded-lg border border-border/60 bg-card/60">
          {balances.map((b) => {
            const incluido = b.incluido !== false;
            return (
            <li
              key={b.id}
              className={cn(
                "flex items-center justify-between border-l-2 px-4 py-3 text-sm",
                !incluido && "opacity-50",
              )}
              style={{ borderLeftColor: b.color || "transparent" }}
            >
              <button
                type="button"
                aria-label={incluido ? "Quitar del total" : "Incluir en el total"}
                title={incluido ? "Quitar del total" : "Incluir en el total"}
                onClick={() =>
                  api.updateLiquidBalance.mutate({ id: b.id, patch: { incluido: !incluido } })
                }
                className="flex flex-1 items-center gap-3 text-left"
              >
                <span
                  className={cn(
                    "size-4 shrink-0 rounded border",
                    !incluido && "border-muted-foreground",
                  )}
                  style={incluido ? { borderColor: b.color || "var(--primary)", background: b.color || "var(--primary)" } : undefined}
                />
                <div>
                  <p className="text-foreground">{b.nombre}</p>
                  <p className="text-xs text-muted-foreground">{TIPO_LABEL[b.tipo]}</p>
                </div>
              </button>
              <div className="flex items-center gap-3">
                <span className="font-mono tabular-nums text-foreground">
                  <Money value={b.monto} />
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label="Historial"
                  onClick={() => setHistoryItem(b)}
                >
                  <History className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label="Editar"
                  onClick={() => setDialogItem(b)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <DeleteButton onConfirm={() => api.deleteLiquidBalance.mutate(b.id)} />
              </div>
            </li>
            );
          })}
        </ul>
      )}

      <Dialog open={historyItem !== null} onOpenChange={(o) => !o && setHistoryItem(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          {historyItem && (
            <LiquidBalanceHistoryContent
              item={historyItem}
              entries={history.filter((h) => h.balanceId === historyItem.id)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LiquidBalanceHistoryContent({
  item,
  entries,
}: {
  item: LiquidBalance;
  entries: LiquidBalanceHistoryEntry[];
}) {
  const { isHidden } = useHiddenBalances();
  const sorted = [...entries].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const chartData = sorted.map((e) => ({ fecha: e.fecha, label: formatShortDate(e.fecha), monto: e.monto }));

  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Historial de {item.nombre}</DialogTitle>
      </DialogHeader>

      {chartData.length >= 2 && (
        <div className="rounded-lg border border-border/60 bg-card/40 p-2">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
              <defs>
                <linearGradient id="gradLiquidHistory" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={56}
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
                formatter={(value) => [isHidden ? "••••••" : formatCurrency(Number(value)), "Monto"]}
              />
              <Area
                type="monotone"
                dataKey="monto"
                stroke="var(--chart-1)"
                strokeWidth={2}
                strokeLinecap="round"
                fill="url(#gradLiquidHistory)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Sin historial todavía.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border/60 rounded-lg border border-border/60">
          {[...sorted].reverse().map((e) => (
            <li key={e.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-foreground">{formatShortDate(e.fecha)}</span>
              <span className="font-mono tabular-nums text-foreground">
                <Money value={e.monto} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LiquidForm({
  initial,
  onSubmit,
}: {
  initial: LiquidBalance | null;
  onSubmit: (values: Omit<LiquidBalance, "id">) => Promise<void>;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [monto, setMonto] = useState(String(initial?.monto ?? ""));
  const [tipo, setTipo] = useState<LiquidBalanceType>(initial?.tipo ?? "ahorro");
  const [color, setColor] = useState(initial?.color ?? COLOR_PRESETS[0]);
  const [submitting, setSubmitting] = useState(false);
  const montoValue = evalAmountExpression(monto);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (montoValue === null) return;
    setSubmitting(true);
    try {
      await onSubmit({ nombre, monto: montoValue, tipo, color });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{initial ? "Editar registro" : "Nuevo registro"}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="l-nombre">Nombre (ej. Cajita Nu, Nómina)</Label>
        <Input id="l-nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="l-monto">Monto (MXN)</Label>
          <AmountInput id="l-monto" required value={monto} onChange={setMonto} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as LiquidBalanceType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ahorro">Ahorro</SelectItem>
              <SelectItem value="ingreso_esperado">Ingreso esperado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Color ${c}`}
              onClick={() => setColor(c)}
              className={cn(
                "size-7 rounded-full border-2 transition-transform",
                color === c ? "scale-110 border-foreground" : "border-border/50",
              )}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting || montoValue === null}>
          {submitting ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
