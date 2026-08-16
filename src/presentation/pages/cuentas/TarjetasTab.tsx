import { useMemo, useState, type FormEvent } from "react";
import { Plus, Pencil, Check, X, CreditCard as CardIcon, CalendarClock, Share2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/presentation/components/StatCard";
import { DeleteButton } from "@/presentation/components/DeleteButton";
import { SnapshotHistory } from "@/presentation/components/SnapshotHistory";
import { Money } from "@/presentation/components/Money";
import type { useCuentas } from "@/presentation/hooks/useCuentas";
import type { CardWithPayments } from "@/application/use-cases/cuentas/getCuentasOverview";
import type { CardPayment, CreditCard, CuentasSnapshot } from "@/domain/entities/cuentas";
import { formatCurrency, formatShortDate } from "@/shared/utils/format";
import { evalAmountExpression } from "@/shared/utils/evalAmountExpression";
import { addMonths, currentWeekRange, formatMonthLabel, toDateOnly } from "@/shared/utils/dates";
import { COLOR_PRESETS } from "@/shared/colorPresets";
import { cn } from "@/lib/utils";

type CuentasApi = ReturnType<typeof useCuentas>;

/** Fecha mas cercana con pagos pendientes (y su suma), sin importar si ya
 * esta vencida o es a futuro. */
function nextPaymentInfo(pagos: CardPayment[]): { fecha: string; monto: number } | null {
  const unpaid = pagos.filter((p) => !p.pagado);
  if (unpaid.length === 0) return null;
  const minFecha = unpaid.reduce((min, p) => (p.fecha < min ? p.fecha : min), unpaid[0].fecha);
  const monto = unpaid
    .filter((p) => p.fecha === minFecha)
    .reduce((s, p) => s + p.monto, 0);
  return { fecha: minFecha, monto };
}

function cardPagosDelMes(card: CardWithPayments, targetMonthKey: string): CardPayment[] {
  return card.pagos
    .filter((p) => !p.pagado && p.fecha.slice(0, 7) === targetMonthKey)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Semanas lunes-domingo que tocan el mes dado, recortadas a sus limites
 * (la primera y ultima semana pueden quedar parciales). */
function weeksOfMonth(monthKey: string): { start: string; end: string }[] {
  const [y, m] = monthKey.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  const weeks: { start: string; end: string }[] = [];
  let cursor = new Date(first);
  while (cursor <= last) {
    const dow = cursor.getDay();
    const diffToMonday = dow === 0 ? 6 : dow - 1;
    const weekStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - diffToMonday);
    const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
    weeks.push({
      start: toDateOnly(weekStart < first ? first : weekStart),
      end: toDateOnly(weekEnd > last ? last : weekEnd),
    });
    cursor = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate() + 1);
  }
  return weeks;
}

const weekDayFormatter = new Intl.DateTimeFormat("es-MX", { day: "numeric" });
const weekMonthFormatter = new Intl.DateTimeFormat("es-MX", { month: "short" });

function formatWeekRange(start: string, end: string): string {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  return `${weekDayFormatter.format(s)}–${weekDayFormatter.format(e)} ${weekMonthFormatter.format(e)}`;
}

/** Igual a lo que armaba el estado de cuenta por tarjeta, pero juntando todas las tarjetas en un
 * solo texto, con subtotal por tarjeta y total general. */
function buildAllCardsStatementText(cards: CardWithPayments[], monthOffset: number): string {
  const targetMonthKey = addMonths(new Date().toISOString().slice(0, 10), monthOffset).slice(0, 7);
  const lines: string[] = [
    `Pagos de tarjetas - ${formatMonthLabel(targetMonthKey)}`,
    `Generado: ${formatShortDate(new Date().toISOString().slice(0, 10))}`,
    "",
  ];

  let grandTotal = 0;
  let any = false;

  for (const card of cards) {
    const pagosDelMes = cardPagosDelMes(card, targetMonthKey);
    if (pagosDelMes.length === 0) continue;
    any = true;
    lines.push(`${card.nombre}:`);
    let subtotal = 0;
    for (const p of pagosDelMes) {
      subtotal += p.monto;
      lines.push(`  ${formatShortDate(p.fecha)}: ${formatCurrency(p.monto, 2)}`);
    }
    lines.push(`  Subtotal: ${formatCurrency(subtotal, 2)}`);
    lines.push("");
    grandTotal += subtotal;
  }

  if (!any) {
    lines.push(`Sin pagos pendientes ${monthOffset === 0 ? "este mes" : "ese mes"}.`);
  } else {
    lines.push(`Total general: ${formatCurrency(grandTotal, 2)}`);
  }

  return lines.join("\n");
}

async function shareText(title: string, text: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        toast.error("No se pudo compartir");
      }
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  } catch {
    toast.error("No se pudo copiar");
  }
}

function shareAllCardsStatement(cards: CardWithPayments[], monthOffset: number) {
  return shareText("Pagos de tarjetas", buildAllCardsStatementText(cards, monthOffset));
}

export function TarjetasTab({ api, cards, totalPendiente, snapshots, totalLiquidez }: {
  api: CuentasApi;
  cards: CardWithPayments[];
  totalPendiente: number;
  snapshots: CuentasSnapshot[];
  totalLiquidez: number;
}) {
  const [dialogCard, setDialogCard] = useState<CreditCard | "new" | null>(null);
  const [paymentsCardId, setPaymentsCardId] = useState<string | null>(null);
  const paymentsCard = cards.find((c) => c.id === paymentsCardId) ?? null;
  const { start: weekStart, end: weekEnd } = currentWeekRange();
  const allPending = cards.flatMap((c) => c.pagos);
  const weekTotal = allPending
    .filter((p) => !p.pagado && p.fecha >= weekStart && p.fecha <= weekEnd)
    .reduce((s, p) => s + p.monto, 0);

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const cardsMonthDetalle = cards.map((c) => ({
    nombre: c.nombre,
    monto: cardPagosDelMes(c, currentMonthKey).reduce((s, p) => s + p.monto, 0),
  }));
  const totalMesActual = cardsMonthDetalle.reduce((s, c) => s + c.monto, 0);

  const nextMonthKey = addMonths(new Date().toISOString().slice(0, 10), 1).slice(0, 7);
  const nextMonthTotal = allPending
    .filter((p) => !p.pagado && p.fecha.slice(0, 7) === nextMonthKey)
    .reduce((s, p) => s + p.monto, 0);

  const cubreLiquidez = totalLiquidez >= weekTotal;

  const monthWeeks = weeksOfMonth(currentMonthKey).map((w) => ({
    ...w,
    isCurrent: w.start === weekStart,
    total: allPending
      .filter((p) => !p.pagado && p.fecha >= w.start && p.fecha <= w.end)
      .reduce((s, p) => s + p.monto, 0),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <StatCard label="Total pendiente" value={formatCurrency(totalPendiente, 2)} icon={CardIcon} gradient="pink" />
          <StatCard
            label={`Próximos pagos (${formatMonthLabel(nextMonthKey)})`}
            value={formatCurrency(nextMonthTotal, 2)}
            icon={CalendarClock}
            gradient="blue"
          />
          <StatCard
            label="Liquidez disponible"
            value={formatCurrency(totalLiquidez, 2)}
            icon={Wallet}
            tone={cubreLiquidez ? "positive" : "negative"}
          />
        </div>
        <div className="flex items-center gap-2">
          <SnapshotHistory
            tipo="tarjetas"
            label="tarjetas"
            snapshots={snapshots}
            currentTotal={totalMesActual}
            currentDetalle={cardsMonthDetalle}
            onTake={(s) => api.addSnapshot.mutateAsync(s)}
            onDelete={(id) => api.deleteSnapshot.mutateAsync(id)}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Share2 className="size-4" />
                Compartir tarjetas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => shareAllCardsStatement(cards, 0)}>
                Pagos de este mes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => shareAllCardsStatement(cards, 1)}>
                Pagos del próximo mes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      <Card className="border-border/60 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pagos por semana ({formatMonthLabel(currentMonthKey)})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {monthWeeks.map((w) => (
            <div
              key={w.start}
              className={cn(
                "flex flex-col gap-0.5 rounded-lg border px-3 py-2",
                w.isCurrent ? "border-primary/50 bg-primary/10" : "border-border/60",
              )}
            >
              <span className="text-[11px] text-muted-foreground">
                {formatWeekRange(w.start, w.end)}
                {w.isCurrent && " · esta semana"}
              </span>
              <span className="font-mono text-sm tabular-nums text-foreground">
                <Money value={w.total} decimals={2} />
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

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
                    <Money value={c.pendiente} />
                  </span>
                </div>
                {(() => {
                  const next = nextPaymentInfo(c.pagos);
                  return (
                    next && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Próximo pago ({formatShortDate(next.fecha)})
                        </span>
                        <span className="font-mono tabular-nums text-foreground">
                          <Money value={next.monto} />
                        </span>
                      </div>
                    )
                  );
                })()}
                <Button variant="secondary" size="sm" onClick={() => setPaymentsCardId(c.id)}>
                  Ver pagos ({c.pagos.length})
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {cards.length > 0 && <UpcomingPayments cards={cards} />}

      <Dialog open={paymentsCardId !== null} onOpenChange={(o) => !o && setPaymentsCardId(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          {paymentsCard && <CardPayments card={paymentsCard} api={api} />}
        </DialogContent>
      </Dialog>
    </div>
  );
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
                <Money value={overdueTotal} />
              </span>
            </li>
          )}
          {visibleMonths.map(([key, monto]) => (
            <li key={key} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-foreground">{formatMonthLabel(key)}</span>
              <span className="font-mono tabular-nums text-foreground">
                <Money value={monto} />
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
}: {
  card: CardWithPayments;
  api: CuentasApi;
}) {
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [monto, setMonto] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFecha, setEditFecha] = useState("");
  const [editMonto, setEditMonto] = useState("");

  const montoValue = evalAmountExpression(monto);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (montoValue === null) return;
    await api.addCardPayment.mutateAsync({
      tarjetaId: card.id,
      fecha,
      monto: montoValue,
      pagado: false,
    });
    setMonto("");
  }

  function startEdit(p: CardPayment) {
    setEditingId(p.id);
    setEditFecha(p.fecha);
    setEditMonto(String(p.monto));
  }

  const editMontoValue = evalAmountExpression(editMonto);

  async function saveEdit() {
    if (!editingId || editMontoValue === null) return;
    await api.updateCardPayment.mutateAsync({
      id: editingId,
      patch: { fecha: editFecha, monto: editMontoValue },
    });
    setEditingId(null);
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
          <AmountInput id="pay-monto" required value={monto} onChange={setMonto} />
        </div>
        <Button type="submit" size="icon" aria-label="Agregar pago" disabled={montoValue === null}>
          <Plus className="size-4" />
        </Button>
      </form>

      {sorted.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Sin pagos registrados.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border/60">
          {sorted.map((p) =>
            editingId === p.id ? (
              <li key={p.id} className="flex items-end gap-2 py-2">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label className="text-xs">Fecha</Label>
                  <DatePicker value={editFecha} onChange={setEditFecha} />
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label className="text-xs">Monto</Label>
                  <AmountInput value={editMonto} onChange={setEditMonto} />
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
              </li>
            ) : (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <button
                  type="button"
                  onClick={() =>
                    api.toggleCardPayment.mutate({ id: p.id, pagado: !p.pagado })
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
                <div className="flex items-center gap-1">
                  <span className="mr-2 font-mono tabular-nums text-foreground">
                    <Money value={p.monto} />
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Editar pago"
                    onClick={() => startEdit(p)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <DeleteButton ariaLabel="Eliminar pago" onConfirm={() => api.deleteCardPayment.mutate(p.id)} />
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
