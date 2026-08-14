import { useMemo, useState, type FormEvent } from "react";
import { Plus, Pencil, CreditCard as CardIcon, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
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
import { DeleteButton } from "@/presentation/components/DeleteButton";
import { SnapshotHistory } from "@/presentation/components/SnapshotHistory";
import type { useCuentas } from "@/presentation/hooks/useCuentas";
import type { CardWithPayments } from "@/application/use-cases/cuentas/getCuentasOverview";
import type { CreditCard, CuentasSnapshot } from "@/domain/entities/cuentas";
import { formatCurrency, formatShortDate } from "@/shared/utils/format";
import { COLOR_PRESETS } from "@/shared/colorPresets";
import { cn } from "@/lib/utils";

type CuentasApi = ReturnType<typeof useCuentas>;

export function TarjetasTab({ api, cards, totalPendiente, snapshots }: {
  api: CuentasApi;
  cards: CardWithPayments[];
  totalPendiente: number;
  snapshots: CuentasSnapshot[];
}) {
  const [dialogCard, setDialogCard] = useState<CreditCard | "new" | null>(null);
  const [paymentsCard, setPaymentsCard] = useState<CardWithPayments | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <StatCard label="Total pendiente" value={formatCurrency(totalPendiente)} icon={CardIcon} gradient="pink" />
        <div className="flex items-center gap-2">
          <SnapshotHistory
            tipo="tarjetas"
            label="tarjetas"
            snapshots={snapshots}
            currentTotal={totalPendiente}
            currentDetalle={cards.map((c) => ({ nombre: c.nombre, monto: c.pendiente }))}
            onTake={(s) => api.addSnapshot.mutateAsync(s)}
            onDelete={(id) => api.deleteSnapshot.mutateAsync(id)}
          />
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
      </div>

      {cards.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sin tarjetas todavía.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <Card
              key={c.id}
              className="border-border/60 bg-card/60 border-l-2"
              style={{ borderLeftColor: c.color || "var(--border)" }}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CardIcon className="size-4" style={{ color: c.color || "var(--primary)" }} />
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
                  <DeleteButton onConfirm={() => api.deleteCard.mutate(c.id)} />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
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

      {cards.length > 0 && <UpcomingPayments cards={cards} />}

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

const monthFormatter = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" });

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const label = monthFormatter.format(new Date(y, m - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const VISIBLE_STEP = 3;

function UpcomingPayments({ cards }: { cards: CardWithPayments[] }) {
  const [visibleCount, setVisibleCount] = useState(VISIBLE_STEP);

  const { overdueTotal, months } = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 7);
    const pending = cards.flatMap((c) => c.pagos.filter((p) => !p.pagado));

    let overdue = 0;
    const byMonth = new Map<string, number>();
    for (const p of pending) {
      const key = p.fecha.slice(0, 7);
      if (key < todayKey) {
        overdue += p.monto;
      } else {
        byMonth.set(key, (byMonth.get(key) ?? 0) + p.monto);
      }
    }
    const sortedMonths = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return { overdueTotal: overdue, months: sortedMonths };
  }, [cards]);

  if (overdueTotal === 0 && months.length === 0) return null;

  const visibleMonths = months.slice(0, visibleCount);
  const hasMore = months.length > visibleCount;

  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4 text-primary" />
          Próximos pagos
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 p-0">
        <ul className="flex flex-col divide-y divide-border/60">
          {overdueTotal > 0 && (
            <li className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-negative">Atrasado</span>
              <span className="font-mono tabular-nums text-negative">
                {formatCurrency(overdueTotal)}
              </span>
            </li>
          )}
          {visibleMonths.map(([key, monto]) => (
            <li key={key} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-foreground">{monthLabel(key)}</span>
              <span className="font-mono tabular-nums text-foreground">
                {formatCurrency(monto)}
              </span>
            </li>
          ))}
        </ul>
        {(hasMore || visibleCount > VISIBLE_STEP) && (
          <div className="flex justify-center border-t border-border/60 p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setVisibleCount((v) => (hasMore ? v + VISIBLE_STEP : VISIBLE_STEP))
              }
            >
              {hasMore ? "Ver más meses" : "Ver menos"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
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
  const [color, setColor] = useState(initial?.color ?? COLOR_PRESETS[0]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ nombre, color });
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
          <DatePicker id="pay-fecha" value={fecha} onChange={setFecha} />
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
                <DeleteButton ariaLabel="Eliminar pago" onConfirm={() => api.deleteCardPayment.mutate(p.id)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
