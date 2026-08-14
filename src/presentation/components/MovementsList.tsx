import { useState, type FormEvent } from "react";
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
import type { Movement } from "@/domain/entities/common";
import { formatCurrency, formatShortDate } from "@/shared/utils/format";
import { cn } from "@/lib/utils";

interface MovementsListProps {
  movements: Movement[];
  onAdd: (movement: Omit<Movement, "id">) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function MovementsList({ movements, onAdd, onDelete }: MovementsListProps) {
  const [open, setOpen] = useState(false);
  const sorted = [...movements].sort((a, b) => b.fecha.localeCompare(a.fecha));

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
            {sorted.map((m) => (
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
                    {formatCurrency(m.monto)}
                  </span>
                  <DeleteButton ariaLabel="Eliminar movimiento" onConfirm={() => onDelete(m.id)} />
                </div>
              </li>
            ))}
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ fecha, monto: Number(monto), ...(nota ? { nota } : {}) });
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
        <Input
          id="mov-monto"
          type="number"
          step="0.01"
          required
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="mov-nota">Nota (opcional)</Label>
        <Input id="mov-nota" value={nota} onChange={(e) => setNota(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
