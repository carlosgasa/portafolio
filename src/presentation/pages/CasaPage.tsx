import { useState, type FormEvent } from "react";
import { Home, Plus, Pencil, Trash2, Wallet } from "lucide-react";
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
import { useCasaExpenses } from "@/presentation/hooks/useCasaExpenses";
import type { ExpenseItem } from "@/domain/entities/casa";
import { formatCurrency, formatShortDate } from "@/shared/utils/format";

export function CasaPage() {
  const { query, addExpense, updateExpense, deleteExpense, total } = useCasaExpenses();
  const [dialogItem, setDialogItem] = useState<ExpenseItem | "new" | null>(null);

  const sorted = [...(query.data ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <Home className="size-6 text-primary" />
            Casa
          </h1>
          <p className="text-sm text-muted-foreground">Gasto de construcción</p>
        </div>
        <Dialog open={dialogItem !== null} onOpenChange={(o) => !o && setDialogItem(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogItem("new")}>
              <Plus className="size-4" />
              Gasto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <ExpenseForm
              initial={dialogItem !== "new" ? dialogItem : null}
              onSubmit={async (values) => {
                if (dialogItem !== "new" && dialogItem) {
                  await updateExpense.mutateAsync({ id: dialogItem.id, patch: values });
                } else {
                  await addExpense.mutateAsync(values);
                }
                setDialogItem(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:max-w-xs">
        {query.isLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <StatCard label="Total acumulado" value={formatCurrency(total)} icon={Wallet} />
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/60 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Concepto</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Precio unidad</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Sin gastos todavía.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium text-foreground">{e.concepto}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatShortDate(e.fecha)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {e.cantidad}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCurrency(e.precioUnitario)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCurrency(e.total)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="Editar"
                        onClick={() => setDialogItem(e)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="Eliminar"
                        onClick={() => deleteExpense.mutate(e.id)}
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
    </div>
  );
}

function ExpenseForm({
  initial,
  onSubmit,
}: {
  initial: ExpenseItem | null;
  onSubmit: (values: Omit<ExpenseItem, "id">) => Promise<void>;
}) {
  const [concepto, setConcepto] = useState(initial?.concepto ?? "");
  const [cantidad, setCantidad] = useState(String(initial?.cantidad ?? "1"));
  const [precioUnitario, setPrecioUnitario] = useState(String(initial?.precioUnitario ?? ""));
  const [fecha, setFecha] = useState(initial?.fecha ?? new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const cant = Number(cantidad);
      const precio = Number(precioUnitario);
      await onSubmit({ concepto, cantidad: cant, precioUnitario: precio, total: cant * precio, fecha });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{initial ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="c-concepto">Concepto</Label>
        <Input
          id="c-concepto"
          required
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="c-cantidad">Cantidad</Label>
          <Input
            id="c-cantidad"
            type="number"
            step="any"
            required
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="c-precio">Precio unidad (MXN)</Label>
          <Input
            id="c-precio"
            type="number"
            step="any"
            required
            value={precioUnitario}
            onChange={(e) => setPrecioUnitario(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="c-fecha">Fecha</Label>
        <Input
          id="c-fecha"
          type="date"
          required
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
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
