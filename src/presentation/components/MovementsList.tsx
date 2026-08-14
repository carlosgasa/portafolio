import { useState, type FormEvent } from "react";
import { Plus, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { AmountInput } from "@/components/ui/amount-input";
import { DeleteButton } from "@/presentation/components/DeleteButton";
import { Money } from "@/presentation/components/Money";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Movement } from "@/domain/entities/common";
import { evalAmountExpression } from "@/shared/utils/evalAmountExpression";
import { formatShortDate } from "@/shared/utils/format";
import { cn } from "@/lib/utils";

interface MovementsListProps {
  movements: Movement[];
  onAdd: (movement: Omit<Movement, "id">) => Promise<unknown>;
  onUpdate: (id: string, patch: Partial<Omit<Movement, "id">>) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function MovementsList({ movements, onAdd, onUpdate, onDelete }: MovementsListProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFecha, setEditFecha] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editNota, setEditNota] = useState("");
  const sorted = [...movements].sort((a, b) => b.fecha.localeCompare(a.fecha));

  function startEdit(m: Movement) {
    setEditingId(m.id);
    setEditFecha(m.fecha);
    setEditMonto(String(m.monto));
    setEditNota(m.nota ?? "");
  }

  const editMontoValue = evalAmountExpression(editMonto);

  async function saveEdit() {
    if (!editingId || editMontoValue === null) return;
    await onUpdate(editingId, {
      fecha: editFecha,
      monto: editMontoValue,
      ...(editNota ? { nota: editNota } : {}),
    });
    setEditingId(null);
  }

  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Depósitos y retiros</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="secondary">
              <Plus className="size-4" />
              Agregar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <MovementForm
              onSubmit={async (m) => {
                await onAdd(m);
                setOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin movimientos todavía.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/60">
            {sorted.map((m) =>
              editingId === m.id ? (
                <li key={m.id} className="flex flex-col gap-2 py-2">
                  <div className="flex items-end gap-2">
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Label className="text-xs">Fecha</Label>
                      <DatePicker value={editFecha} onChange={setEditFecha} />
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Label className="text-xs">Monto</Label>
                      <AmountInput value={editMonto} onChange={setEditMonto} />
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Label className="text-xs">Nota</Label>
                      <Input value={editNota} onChange={(e) => setEditNota(e.target.value)} />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-positive hover:text-positive"
                      aria-label="Guardar"
                      disabled={editMontoValue === null}
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
                  </div>
                </li>
              ) : (
                <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="text-foreground">{formatShortDate(m.fecha)}</p>
                    {m.nota && <p className="text-xs text-muted-foreground">{m.nota}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "font-mono tabular-nums",
                        m.monto >= 0 ? "text-positive" : "text-negative",
                      )}
                    >
                      <Money value={m.monto} />
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label="Editar movimiento"
                      onClick={() => startEdit(m)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <DeleteButton ariaLabel="Eliminar movimiento" onConfirm={() => onDelete(m.id)} />
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

function MovementForm({
  onSubmit,
}: {
  onSubmit: (movement: Omit<Movement, "id">) => Promise<void>;
}) {
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [monto, setMonto] = useState("");
  const [nota, setNota] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const montoValue = evalAmountExpression(monto);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (montoValue === null) return;
    setSubmitting(true);
    try {
      await onSubmit({ fecha, monto: montoValue, ...(nota ? { nota } : {}) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Nuevo movimiento</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="mov-fecha">Fecha</Label>
        <DatePicker id="mov-fecha" value={fecha} onChange={setFecha} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="mov-monto">Monto (negativo si es retiro)</Label>
        <AmountInput id="mov-monto" required value={monto} onChange={setMonto} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="mov-nota">Nota (opcional)</Label>
        <Input id="mov-nota" value={nota} onChange={(e) => setNota(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting || montoValue === null}>
          {submitting ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
