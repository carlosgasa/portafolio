import { useState } from "react";
import { History, Camera, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DeleteButton } from "@/presentation/components/DeleteButton";
import { Money } from "@/presentation/components/Money";
import { useHiddenBalances } from "@/presentation/hooks/useHiddenBalances";
import type { CuentasSnapshot, SnapshotDetalleItem, SnapshotTipo } from "@/domain/entities/cuentas";
import { formatCurrency, formatShortDate } from "@/shared/utils/format";

interface SnapshotHistoryProps {
  tipo: SnapshotTipo;
  label: string;
  snapshots: CuentasSnapshot[];
  currentTotal: number;
  currentDetalle: SnapshotDetalleItem[];
  onTake: (snapshot: Omit<CuentasSnapshot, "id">) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

/** Boton + dialogo reutilizable para tomar una foto del total actual (con su
 * desglose) y consultar despues cuanto se debia/tenia en una fecha pasada. */
export function SnapshotHistory({
  tipo,
  label,
  snapshots,
  currentTotal,
  currentDetalle,
  onTake,
  onDelete,
}: SnapshotHistoryProps) {
  const [open, setOpen] = useState(false);
  const [taking, setTaking] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { isHidden } = useHiddenBalances();

  const own = snapshots.filter((s) => s.tipo === tipo).sort((a, b) => b.fecha.localeCompare(a.fecha));

  async function handleTake() {
    setTaking(true);
    try {
      await onTake({
        tipo,
        fecha: new Date().toISOString().slice(0, 10),
        total: currentTotal,
        detalle: currentDetalle,
      });
    } finally {
      setTaking(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="size-4" />
          Historial
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de {label}</DialogTitle>
        </DialogHeader>

        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          disabled={taking}
          onClick={handleTake}
        >
          <Camera className="size-4" />
          {taking
            ? "Guardando…"
            : `Tomar snapshot de hoy (${isHidden ? "••••••" : formatCurrency(currentTotal)})`}
        </Button>

        {own.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sin snapshots todavía. Toma una para poder consultarla despues.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/60 rounded-lg border border-border/60">
            {own.map((s) => {
              const isOpen = expanded === s.id;
              return (
                <li key={s.id}>
                  <div className="flex items-center justify-between px-3 py-2">
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-2 text-left text-sm"
                      onClick={() => setExpanded(isOpen ? null : s.id)}
                    >
                      {isOpen ? (
                        <ChevronDown className="size-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-3.5 text-muted-foreground" />
                      )}
                      <span className="text-foreground">{formatShortDate(s.fecha)}</span>
                    </button>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm tabular-nums text-foreground">
                        <Money value={s.total} />
                      </span>
                      <DeleteButton ariaLabel="Eliminar snapshot" onConfirm={() => onDelete(s.id)} />
                    </div>
                  </div>
                  {isOpen && (
                    <ul className="flex flex-col gap-1 bg-muted/30 px-3 py-2 pl-9">
                      {s.detalle.length === 0 ? (
                        <li className="text-xs text-muted-foreground">Sin detalle.</li>
                      ) : (
                        s.detalle.map((d, i) => (
                          <li
                            key={`${d.nombre}-${i}`}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-muted-foreground">{d.nombre}</span>
                            <span className="font-mono tabular-nums text-foreground">
                              <Money value={d.monto} />
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
