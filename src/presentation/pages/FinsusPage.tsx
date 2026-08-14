import { useState, type FormEvent } from "react";
import { Landmark, Plus, Pencil, Wallet, PiggyBank, TrendingUp, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { AmountInput } from "@/components/ui/amount-input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
import { useFinsusPortfolio } from "@/presentation/hooks/useFinsusPortfolio";
import type { FixedTermAccount } from "@/domain/entities/finsus";
import { evalAmountExpression } from "@/shared/utils/evalAmountExpression";
import { formatCurrency, formatPercent, formatShortDate } from "@/shared/utils/format";

/** % del plazo (apertura -> vencimiento) que ya transcurrio, 0-100. */
function progresoPct(a: FixedTermAccount): number {
  const start = new Date(`${a.fechaApertura}T00:00:00`).getTime();
  const end = new Date(`${a.fechaVencimiento}T00:00:00`).getTime();
  const now = Date.now();
  if (end <= start) return 100;
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

/** Todas las inversiones pagan mensual el equivalente al rendimiento; la
 * tasa siempre es anual. */
function pagoMensual(a: FixedTermAccount): number {
  return (a.saldo * (a.tasa / 100)) / 12;
}

export function FinsusPage() {
  const {
    query,
    addAccount,
    updateAccount,
    deleteAccount,
    addMovement,
    updateMovement,
    deleteMovement,
  } = useFinsusPortfolio();
  const [dialogAccount, setDialogAccount] = useState<FixedTermAccount | "new" | null>(null);

  const data = query.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <Landmark className="size-6 text-primary" />
            Finsus
          </h1>
          <p className="text-sm text-muted-foreground">
            Pagarés a plazo fijo y movimientos
          </p>
        </div>
        <div className="flex items-center gap-2">
        <HideBalancesButton />
        <Dialog open={dialogAccount !== null} onOpenChange={(o) => !o && setDialogAccount(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogAccount("new")}>
              <Plus className="size-4" />
              Inversión
            </Button>
          </DialogTrigger>
          <DialogContent>
            <AccountForm
              initial={dialogAccount !== "new" ? dialogAccount : null}
              onSubmit={async (values) => {
                if (dialogAccount !== "new" && dialogAccount) {
                  await updateAccount.mutateAsync({ id: dialogAccount.id, patch: values });
                } else {
                  await addAccount.mutateAsync(values);
                }
                setDialogAccount(null);
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
            <StatCard label="Saldo total" value={formatCurrency(data?.valorTotal ?? 0)} icon={Wallet} />
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
              <TableHead>Inversión</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-right">Tasa</TableHead>
              <TableHead className="text-right">Pago mensual</TableHead>
              <TableHead>Apertura</TableHead>
              <TableHead>Vence</TableHead>
              <TableHead className="w-32">Progreso</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ) : data?.accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Sin inversiones todavía.
                </TableCell>
              </TableRow>
            ) : (
              data?.accounts.map((a) => (
                <TableRow key={a.id} className={cn(a.vencida && "opacity-50")}>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {a.cuenta}
                      {a.vencida && (
                        <Badge variant="outline" className="text-[10px]">
                          Vencida
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    <Money value={a.saldo} />
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{a.tasa}%</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    <Money value={pagoMensual(a)} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatShortDate(a.fechaApertura)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatShortDate(a.fechaVencimiento)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${progresoPct(a)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {progresoPct(a).toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={a.vencida ? "Marcar como activa" : "Marcar como vencida"}
                        title={a.vencida ? "Marcar como activa" : "Marcar como vencida"}
                        onClick={() =>
                          updateAccount.mutate({ id: a.id, patch: { vencida: !a.vencida } })
                        }
                      >
                        <History className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="Editar"
                        onClick={() => setDialogAccount(a)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <DeleteButton onConfirm={() => deleteAccount.mutate(a.id)} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <MovementsList
        movements={data?.movements ?? []}
        onAdd={(m) => addMovement.mutateAsync(m)}
        onUpdate={(id, patch) => updateMovement.mutateAsync({ id, patch })}
        onDelete={(id) => deleteMovement.mutateAsync(id)}
      />
    </div>
  );
}

function AccountForm({
  initial,
  onSubmit,
}: {
  initial: FixedTermAccount | null;
  onSubmit: (values: Omit<FixedTermAccount, "id">) => Promise<void>;
}) {
  const [cuenta, setCuenta] = useState(initial?.cuenta ?? "");
  const [saldo, setSaldo] = useState(String(initial?.saldo ?? ""));
  const [tasa, setTasa] = useState(String(initial?.tasa ?? ""));
  const today = new Date().toISOString().slice(0, 10);
  const [fechaApertura, setFechaApertura] = useState(initial?.fechaApertura ?? today);
  const [fechaVencimiento, setFechaVencimiento] = useState(initial?.fechaVencimiento ?? today);
  const [submitting, setSubmitting] = useState(false);
  const saldoValue = evalAmountExpression(saldo);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saldoValue === null) return;
    setSubmitting(true);
    try {
      await onSubmit({
        cuenta,
        saldo: saldoValue,
        tasa: Number(tasa),
        fechaApertura,
        fechaVencimiento,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{initial ? "Editar inversión" : "Nueva inversión"}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="f-cuenta">Inversión</Label>
        <Input id="f-cuenta" required value={cuenta} onChange={(e) => setCuenta(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="f-saldo">Saldo (MXN)</Label>
          <AmountInput id="f-saldo" required value={saldo} onChange={setSaldo} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="f-tasa">Tasa anual (%)</Label>
          <Input
            id="f-tasa"
            type="number"
            step="any"
            required
            value={tasa}
            onChange={(e) => setTasa(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="f-apertura">Fecha apertura</Label>
          <DatePicker id="f-apertura" value={fechaApertura} onChange={setFechaApertura} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="f-vence">Fecha vencimiento</Label>
          <DatePicker id="f-vence" value={fechaVencimiento} onChange={setFechaVencimiento} />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting || saldoValue === null}>
          {submitting ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
