import { useState, type FormEvent } from "react";
import { TrendingUp, Plus, Pencil, Trash2, Wallet, PiggyBank, Tag } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/presentation/components/StatCard";
import { MovementsList } from "@/presentation/components/MovementsList";
import { useBolsaPortfolio } from "@/presentation/hooks/useBolsaPortfolio";
import type { StockHolding } from "@/domain/entities/bolsa";
import type { StockHoldingWithValue } from "@/application/use-cases/bolsa/getBolsaPortfolio";
import { formatCurrency, formatPercent } from "@/shared/utils/format";
import { cn } from "@/lib/utils";

export function BolsaPage() {
  const {
    query,
    addHolding,
    updateHolding,
    deleteHolding,
    addMovement,
    deleteMovement,
    setPrice,
  } = useBolsaPortfolio();
  const [dialogHolding, setDialogHolding] = useState<StockHoldingWithValue | "new" | null>(null);
  const [priceTicker, setPriceTicker] = useState<string | null>(null);

  const data = query.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <TrendingUp className="size-6 text-primary" />
            Bolsa
          </h1>
          <p className="text-sm text-muted-foreground">
            Acciones, ETFs y movimientos
          </p>
        </div>
        <Dialog
          open={dialogHolding !== null}
          onOpenChange={(o) => !o && setDialogHolding(null)}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setDialogHolding("new")}>
              <Plus className="size-4" />
              Holding
            </Button>
          </DialogTrigger>
          <DialogContent>
            <HoldingForm
              initial={dialogHolding !== "new" ? dialogHolding : null}
              onSubmit={async (values) => {
                if (dialogHolding !== "new" && dialogHolding) {
                  await updateHolding.mutateAsync({ id: dialogHolding.id, patch: values });
                } else {
                  await addHolding.mutateAsync(values);
                }
                setDialogHolding(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {query.isLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <StatCard label="Valor total" value={formatCurrency(data?.valorTotal ?? 0)} icon={Wallet} />
            <StatCard
              label="Aporte total"
              value={formatCurrency(data?.aporteTotal ?? 0)}
              icon={PiggyBank}
              gradient="cyan"
            />
            <StatCard
              label="Rendimiento"
              value={formatPercent(data?.rendimiento ?? 0)}
              icon={TrendingUp}
              tone={(data?.rendimiento ?? 0) >= 0 ? "positive" : "negative"}
            />
          </>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/60 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Costo total</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Ganancia</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ) : data?.holdings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Sin holdings todavía.
                </TableCell>
              </TableRow>
            ) : (
              data?.holdings.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium text-foreground">{h.ticker}</TableCell>
                  <TableCell className="text-muted-foreground">{h.nombre}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {h.cantidad}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCurrency(h.costoTotal)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {h.precio !== null ? formatCurrency(h.precio) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {h.valorActual !== null ? formatCurrency(h.valorActual) : "—"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono tabular-nums",
                      h.ganancia !== null && (h.ganancia >= 0 ? "text-positive" : "text-negative"),
                    )}
                  >
                    {h.ganancia !== null ? formatCurrency(h.ganancia) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="Actualizar precio"
                        onClick={() => setPriceTicker(h.ticker)}
                      >
                        <Tag className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="Editar"
                        onClick={() => setDialogHolding(h)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="Eliminar"
                        onClick={() => deleteHolding.mutate(h.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={priceTicker !== null} onOpenChange={(o) => !o && setPriceTicker(null)}>
        <DialogContent>
          {priceTicker && (
            <PriceForm
              ticker={priceTicker}
              onSubmit={async (price) => {
                await setPrice.mutateAsync(price);
                setPriceTicker(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <MovementsList
        movements={data?.movements ?? []}
        onAdd={(m) => addMovement.mutateAsync(m)}
        onDelete={(id) => deleteMovement.mutateAsync(id)}
      />
    </div>
  );
}

function HoldingForm({
  initial,
  onSubmit,
}: {
  initial: StockHolding | null;
  onSubmit: (values: Omit<StockHolding, "id">) => Promise<void>;
}) {
  const [ticker, setTicker] = useState(initial?.ticker ?? "");
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [cantidad, setCantidad] = useState(String(initial?.cantidad ?? ""));
  const [costoTotal, setCostoTotal] = useState(String(initial?.costoTotal ?? ""));
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        ticker: ticker.toUpperCase(),
        nombre,
        cantidad: Number(cantidad),
        costoTotal: Number(costoTotal),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{initial ? "Editar holding" : "Nuevo holding"}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="s-ticker">Ticker (ej. DANHOS13, VOO)</Label>
        <Input id="s-ticker" required value={ticker} onChange={(e) => setTicker(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="s-nombre">Nombre</Label>
        <Input id="s-nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="s-cantidad">Cantidad</Label>
          <Input
            id="s-cantidad"
            type="number"
            step="any"
            required
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="s-costo">Costo total de compra (MXN)</Label>
          <Input
            id="s-costo"
            type="number"
            step="any"
            required
            value={costoTotal}
            onChange={(e) => setCostoTotal(e.target.value)}
          />
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

function PriceForm({
  ticker,
  onSubmit,
}: {
  ticker: string;
  onSubmit: (price: { ticker: string; precio: number; fecha: string }) => Promise<void>;
}) {
  const [precio, setPrecio] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        ticker,
        precio: Number(precio),
        fecha: new Date().toISOString().slice(0, 10),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Actualizar precio de {ticker}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="p-precio">Precio actual (MXN)</Label>
        <Input
          id="p-precio"
          type="number"
          step="any"
          required
          autoFocus
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
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
