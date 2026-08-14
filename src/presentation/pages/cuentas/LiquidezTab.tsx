import { useState, type FormEvent } from "react";
import { Plus, Pencil, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { useCuentas } from "@/presentation/hooks/useCuentas";
import type { CuentasSnapshot, LiquidBalance, LiquidBalanceType } from "@/domain/entities/cuentas";
import { formatCurrency } from "@/shared/utils/format";
import { COLOR_PRESETS } from "@/shared/colorPresets";
import { cn } from "@/lib/utils";

type CuentasApi = ReturnType<typeof useCuentas>;

const TIPO_LABEL: Record<LiquidBalanceType, string> = {
  ahorro: "Ahorro",
  ingreso_esperado: "Ingreso esperado",
};

export function LiquidezTab({ api, balances, total, snapshots }: {
  api: CuentasApi;
  balances: LiquidBalance[];
  total: number;
  snapshots: CuentasSnapshot[];
}) {
  const [dialogItem, setDialogItem] = useState<LiquidBalance | "new" | null>(null);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ nombre, monto: Number(monto), tipo, color });
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
          <Input
            id="l-monto"
            type="number"
            step="any"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
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
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
