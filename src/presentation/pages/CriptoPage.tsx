import { useState, type FormEvent } from "react";
import { Bitcoin, Plus, Pencil, Tag, Wallet, PiggyBank, TrendingUp } from "lucide-react";
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
import { DeleteButton } from "@/presentation/components/DeleteButton";
import { HideBalancesButton } from "@/presentation/components/HideBalancesButton";
import { Money } from "@/presentation/components/Money";
import { useCryptoPortfolio } from "@/presentation/hooks/useCryptoPortfolio";
import type { CryptoHolding } from "@/domain/entities/cripto";
import type { CryptoHoldingWithValue } from "@/application/use-cases/cripto/getCryptoPortfolio";
import { formatCurrency, formatPercent } from "@/shared/utils/format";
import { cn } from "@/lib/utils";

export function CriptoPage() {
  const {
    query,
    addHolding,
    updateHolding,
    deleteHolding,
    addMovement,
    updateMovement,
    deleteMovement,
    setPrice,
  } = useCryptoPortfolio();
  const [dialogHolding, setDialogHolding] = useState<CryptoHoldingWithValue | "new" | null>(
    null,
  );
  const [priceSymbol, setPriceSymbol] = useState<string | null>(null);

  const data = query.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <Bitcoin className="size-6 text-primary" />
            Cripto
          </h1>
          <p className="text-sm text-muted-foreground">
            Holdings, precios y movimientos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HideBalancesButton />
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
              <TableHead>Símbolo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Costo total</TableHead>
              <TableHead className="text-right">Precio actual</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Ganancia</TableHead>
              <TableHead className="w-20" />
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
                  <TableCell className="font-medium text-foreground">{h.symbol}</TableCell>
                  <TableCell className="text-muted-foreground">{h.nombre}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {h.cantidad}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    <Money value={h.costoTotal} />
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {h.precioMxn !== null ? <Money value={h.precioMxn} /> : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {h.valorActual !== null ? <Money value={h.valorActual} /> : "—"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono tabular-nums",
                      h.ganancia !== null && (h.ganancia >= 0 ? "text-positive" : "text-negative"),
                    )}
                  >
                    {h.ganancia !== null ? <Money value={h.ganancia} /> : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="Actualizar precio"
                        onClick={() => setPriceSymbol(h.symbol)}
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
                      <DeleteButton onConfirm={() => deleteHolding.mutate(h.id)} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={priceSymbol !== null} onOpenChange={(o) => !o && setPriceSymbol(null)}>
        <DialogContent>
          {priceSymbol && (
            <PriceForm
              symbol={priceSymbol}
              onSubmit={async (price) => {
                await setPrice.mutateAsync(price);
                setPriceSymbol(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <MovementsList
        movements={data?.movements ?? []}
        onAdd={(m) => addMovement.mutateAsync(m)}
        onUpdate={(id, patch) => updateMovement.mutateAsync({ id, patch })}
        onDelete={(id) => deleteMovement.mutateAsync(id)}
      />
    </div>
  );
}

function HoldingForm({
  initial,
  onSubmit,
}: {
  initial: CryptoHolding | null;
  onSubmit: (values: Omit<CryptoHolding, "id">) => Promise<void>;
}) {
  const [symbol, setSymbol] = useState(initial?.symbol ?? "");
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [cantidad, setCantidad] = useState(String(initial?.cantidad ?? ""));
  const [costoTotal, setCostoTotal] = useState(String(initial?.costoTotal ?? ""));
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        symbol: symbol.toUpperCase(),
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
        <Label htmlFor="h-symbol">Símbolo (ej. BTC, SOL)</Label>
        <Input id="h-symbol" required value={symbol} onChange={(e) => setSymbol(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="h-nombre">Nombre / wallet</Label>
        <Input id="h-nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="h-cantidad">Cantidad</Label>
          <Input
            id="h-cantidad"
            type="number"
            step="any"
            required
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="h-costo">Costo total de compra (MXN)</Label>
          <Input
            id="h-costo"
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
  symbol,
  onSubmit,
}: {
  symbol: string;
  onSubmit: (price: { symbol: string; precioUsd: number; precioMxn: number; fecha: string }) => Promise<void>;
}) {
  const [precioMxn, setPrecioMxn] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        symbol,
        precioUsd: 0,
        precioMxn: Number(precioMxn),
        fecha: new Date().toISOString().slice(0, 10),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Actualizar precio de {symbol}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cp-precio">Precio actual (MXN)</Label>
        <Input
          id="cp-precio"
          type="number"
          step="any"
          required
          autoFocus
          value={precioMxn}
          onChange={(e) => setPrecioMxn(e.target.value)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Se sobreescribe automaticamente cada dia si el simbolo tiene precio disponible.
      </p>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
