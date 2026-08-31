import { useMemo, useState, type FormEvent } from "react";
import { Home, Plus, Pencil, Wallet, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { AmountInput } from "@/components/ui/amount-input";
import { today } from "@/shared/utils/dates";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/presentation/components/StatCard";
import { DeleteButton } from "@/presentation/components/DeleteButton";
import { HideBalancesButton } from "@/presentation/components/HideBalancesButton";
import { Money } from "@/presentation/components/Money";
import { SortableTableHead } from "@/presentation/components/SortableTableHead";
import { useCasaExpenses } from "@/presentation/hooks/useCasaExpenses";
import type { ExpenseItem } from "@/domain/entities/casa";
import { formatCurrency, formatShortDate } from "@/shared/utils/format";
import { evalAmountExpression } from "@/shared/utils/evalAmountExpression";

const CATEGORIA_SUGERENCIAS = ["Construcción", "Acabados", "Instalaciones", "Mobiliario", "Otros"];

const CATEGORY_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
const SIN_CATEGORIA = "Sin categoría";

type SortKey = "concepto" | "fecha" | "cantidad" | "precioUnitario" | "total" | "categoria";

export function CasaPage() {
  const { query, addExpense, updateExpense, deleteExpense, total } = useCasaExpenses();
  const [dialogItem, setDialogItem] = useState<ExpenseItem | "new" | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("fecha");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  const items = query.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (e) => e.concepto.toLowerCase().includes(q) || (e.categoria ?? "").toLowerCase().includes(q),
    );
  }, [items, search]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "cantidad":
          return (a.cantidad - b.cantidad) * dir;
        case "precioUnitario":
          return (a.precioUnitario - b.precioUnitario) * dir;
        case "total":
          return (a.total - b.total) * dir;
        case "concepto":
          return a.concepto.localeCompare(b.concepto) * dir;
        case "categoria":
          return (a.categoria ?? "").localeCompare(b.categoria ?? "") * dir;
        case "fecha":
        default:
          return (a.fecha ?? "").localeCompare(b.fecha ?? "") * dir;
      }
    });
  }, [filtered, sortKey, sortDir]);

  const byCategory = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of items) {
      const key = item.categoria || SIN_CATEGORIA;
      totals.set(key, (totals.get(key) ?? 0) + item.total);
    }
    const totalGeneral = [...totals.values()].reduce((s, v) => s + v, 0);
    const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const top = ranked.slice(0, 5);
    const rest = ranked.slice(5);
    if (rest.length > 0) {
      const restTotal = rest.reduce((s, [, v]) => s + v, 0);
      top.push(["Otros", restTotal]);
    }
    return top.map(([nombre, monto], i) => ({
      nombre,
      monto,
      pct: totalGeneral > 0 ? (monto / totalGeneral) * 100 : 0,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));
  }, [items]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "concepto" || key === "categoria" ? "asc" : "desc");
    }
  }

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
        <div className="flex items-center gap-2">
        <HideBalancesButton />
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
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,20rem)_1fr]">
        {query.isLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <StatCard label="Total acumulado" value={formatCurrency(total)} icon={Wallet} />
        )}

        {!query.isLoading && byCategory.length > 0 && (
          <Card className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gasto por categoría
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {byCategory.map((c) => (
                <div key={c.nombre} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-foreground">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: c.color }}
                      />
                      {c.nombre}
                    </span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      <Money value={c.monto} /> · {c.pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${c.pct}%`, background: c.color }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="relative sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por concepto o categoría…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/60 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead label="Concepto" sortKey="concepto" currentKey={sortKey} direction={sortDir} onSort={toggleSort} />
              <SortableTableHead label="Categoría" sortKey="categoria" currentKey={sortKey} direction={sortDir} onSort={toggleSort} />
              <SortableTableHead label="Fecha" sortKey="fecha" currentKey={sortKey} direction={sortDir} onSort={toggleSort} />
              <SortableTableHead label="Cantidad" sortKey="cantidad" currentKey={sortKey} direction={sortDir} onSort={toggleSort} className="text-right" />
              <SortableTableHead label="Precio unidad" sortKey="precioUnitario" currentKey={sortKey} direction={sortDir} onSort={toggleSort} className="text-right" />
              <SortableTableHead label="Total" sortKey="total" currentKey={sortKey} direction={sortDir} onSort={toggleSort} className="text-right" />
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {search ? "Sin resultados para tu búsqueda." : "Sin gastos todavía."}
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium text-foreground">{e.concepto}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.categoria || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.fecha ? formatShortDate(e.fecha) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {e.cantidad}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    <Money value={e.precioUnitario} />
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    <Money value={e.total} />
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
                      <DeleteButton onConfirm={() => deleteExpense.mutate(e.id)} />
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
  const [categoria, setCategoria] = useState(initial?.categoria ?? "");
  const [cantidad, setCantidad] = useState(String(initial?.cantidad ?? "1"));
  const [precioUnitario, setPrecioUnitario] = useState(String(initial?.precioUnitario ?? ""));
  const [fecha, setFecha] = useState(initial?.fecha ?? today());
  const [submitting, setSubmitting] = useState(false);
  const precioValue = evalAmountExpression(precioUnitario);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (precioValue === null) return;
    setSubmitting(true);
    try {
      const cant = Number(cantidad);
      const precio = precioValue;
      await onSubmit({
        concepto,
        cantidad: cant,
        precioUnitario: precio,
        total: cant * precio,
        fecha,
        ...(categoria ? { categoria } : {}),
      });
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="c-categoria">Categoría</Label>
        <Input
          id="c-categoria"
          list="c-categoria-list"
          placeholder="ej. Construcción"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        />
        <datalist id="c-categoria-list">
          {CATEGORIA_SUGERENCIAS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="c-cantidad">Cantidad</Label>
          <Input
            id="c-cantidad"
            type="number"
            inputMode="decimal"
            step="any"
            required
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="c-precio">Precio unidad (MXN)</Label>
          <AmountInput id="c-precio" required value={precioUnitario} onChange={setPrecioUnitario} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="c-fecha">Fecha</Label>
        <DatePicker id="c-fecha" value={fecha} onChange={setFecha} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting || precioValue === null}>
          {submitting ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
