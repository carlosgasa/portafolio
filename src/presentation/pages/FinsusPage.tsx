import { useState, type FormEvent } from "react";
import { Landmark, Plus, Pencil, Wallet, PiggyBank, TrendingUp, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
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
import { useFinsusPortfolio } from "@/presentation/hooks/useFinsusPortfolio";
import type { FixedTermAccount } from "@/domain/entities/finsus";
import { formatCurrency, formatPercent, formatShortDate } from "@/shared/utils/format";

export function FinsusPage() {
  const { query, addAccount, updateAccount, deleteAccount, addMovement, deleteMovement } =
    useFinsusPortfolio();
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
              <TableHead>Plazo</TableHead>
              <TableHead>Apertura</TableHead>
              <TableHead>Vence</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ) : data?.accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                    {formatCurrency(a.saldo)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{a.tasa}%</TableCell>
                  <TableCell className="text-muted-foreground">{a.plazo}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatShortDate(a.fechaApertura)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatShortDate(a.fechaVencimiento)}
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
  const [plazo, setPlazo] = useState(initial?.plazo ?? "");
  const today = new Date().toISOString().slice(0, 10);
  const [fechaApertura, setFechaApertura] = useState(initial?.fechaApertura ?? today);
  const [fechaVencimiento, setFechaVencimiento] = useState(initial?.fechaVencimiento ?? today);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        cuenta,
        saldo: Number(saldo),
        tasa: Number(tasa),
        plazo,
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
          <Input
            id="f-saldo"
            type="number"
            step="any"
            required
            value={saldo}
            onChange={(e) => setSaldo(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="f-tasa">Tasa (%)</Label>
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="f-plazo">Plazo</Label>
        <Input id="f-plazo" value={plazo} onChange={(e) => setPlazo(e.target.value)} />
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
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
