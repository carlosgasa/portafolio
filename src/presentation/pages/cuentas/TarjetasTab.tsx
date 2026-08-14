import { useState, type FormEvent } from "react";
import { Plus, Pencil, Trash2, CreditCard as CardIcon } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/presentation/components/StatCard";
import type { useCuentas } from "@/presentation/hooks/useCuentas";
import type { CardWithPayments } from "@/application/use-cases/cuentas/getCuentasOverview";
import type { CreditCard } from "@/domain/entities/cuentas";
import { formatCurrency, formatShortDate } from "@/shared/utils/format";
import { cn } from "@/lib/utils";

type CuentasApi = ReturnType<typeof useCuentas>;

export function TarjetasTab({ api, cards, totalPendiente }: {
  api: CuentasApi;
  cards: CardWithPayments[];
  totalPendiente: number;
}) {
  const [dialogCard, setDialogCard] = useState<CreditCard | "new" | null>(null);
  const [paymentsCard, setPaymentsCard] = useState<CardWithPayments | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <StatCard label="Total pendiente" value={formatCurrency(totalPendiente)} icon={CardIcon} gradient="pink" />
        <Dialog open={dialogCard !== null} onOpenChange={(o) => !o && setDialogCard(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogCard("new")}>
              <Plus className="size-4" />
              Tarjeta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <CardForm
              initial={dialogCard !== "new" ? dialogCard : null}
              onSubmit={async (values) => {
                if (dialogCard !== "new" && dialogCard) {
                  await api.updateCard.mutateAsync({ id: dialogCard.id, patch: values });
                } else {
                  await api.addCard.mutateAsync(values);
                }
                setDialogCard(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {cards.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sin tarjetas todavía.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <Card key={c.id} className="border-border/60 bg-card/60">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CardIcon className="size-4 text-primary" />
                  {c.nombre}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Editar"
                    onClick={() => setDialogCard(c)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Eliminar"
                    onClick={() => api.deleteCard.mutate(c.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gasto mes actual</span>
                  <span className="font-mono tabular-nums text-foreground">
                    {formatCurrency(c.gastoMesActual)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pendiente por pagar</span>
                  <span className="font-mono tabular-nums text-negative">
                    {formatCurrency(c.pendiente)}
                  </span>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setPaymentsCard(c)}>
                  Ver pagos ({c.pagos.length})
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={paymentsCard !== null} onOpenChange={(o) => !o && setPaymentsCard(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          {paymentsCard && (
            <CardPayments
              card={paymentsCard}
              api={api}
              onChanged={(updated) => setPaymentsCard(updated)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CardForm({
  initial,
  onSubmit,
}: {
  initial: CreditCard | null;
  onSubmit: (values: Omit<CreditCard, "id">) => Promise<void>;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [gastoMesActual, setGastoMesActual] = useState(String(initial?.gastoMesActual ?? "0"));
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ nombre, gastoMesActual: Number(gastoMesActual) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{initial ? "Editar tarjeta" : "Nueva tarjeta"}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="t-nombre">Nombre</Label>
        <Input id="t-nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="t-gasto">Gasto mes actual (MXN)</Label>
        <Input
          id="t-gasto"
          type="number"
          step="any"
          required
          value={gastoMesActual}
          onChange={(e) => setGastoMesActual(e.target.value)}
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

function CardPayments({
  card,
  api,
  onChanged,
}: {
  card: CardWithPayments;
  api: CuentasApi;
  onChanged: (card: CardWithPayments) => void;
}) {
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [monto, setMonto] = useState("");

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    await api.addCardPayment.mutateAsync({
      tarjetaId: card.id,
      fecha,
      monto: Number(monto),
      pagado: false,
    });
    setMonto("");
  }

  const sorted = [...card.pagos].sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Pagos de {card.nombre}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleAdd} className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="pay-fecha" className="text-xs">Fecha</Label>
          <Input
            id="pay-fecha"
            type="date"
            required
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="pay-monto" className="text-xs">Monto</Label>
          <Input
            id="pay-monto"
            type="number"
            step="any"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
        </div>
        <Button type="submit" size="icon" aria-label="Agregar pago">
          <Plus className="size-4" />
        </Button>
      </form>

      {sorted.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Sin pagos registrados.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border/60">
          {sorted.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2 text-sm">
              <button
                type="button"
                onClick={() =>
                  api.toggleCardPayment.mutate(
                    { id: p.id, pagado: !p.pagado },
                    {
                      onSuccess: () =>
                        onChanged({
                          ...card,
                          pagos: card.pagos.map((x) =>
                            x.id === p.id ? { ...x, pagado: !p.pagado } : x,
                          ),
                        }),
                    },
                  )
                }
                className="flex items-center gap-2 text-left"
              >
                <span
                  className={cn(
                    "size-3 rounded-full border",
                    p.pagado ? "border-positive bg-positive" : "border-muted-foreground",
                  )}
                />
                <span className={cn(p.pagado && "text-muted-foreground line-through")}>
                  {formatShortDate(p.fecha)}
                </span>
              </button>
              <div className="flex items-center gap-3">
                <span className="font-mono tabular-nums text-foreground">
                  {formatCurrency(p.monto)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label="Eliminar pago"
                  onClick={() => api.deleteCardPayment.mutate(p.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
