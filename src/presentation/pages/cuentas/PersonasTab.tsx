import { useState, type FormEvent } from "react";
import { Plus, Users, ChevronRight, Pencil, Check, X, Share2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/presentation/components/StatCard";
import { DeleteButton } from "@/presentation/components/DeleteButton";
import { SnapshotHistory } from "@/presentation/components/SnapshotHistory";
import { Money } from "@/presentation/components/Money";
import { useHiddenBalances } from "@/presentation/hooks/useHiddenBalances";
import type { useCuentas } from "@/presentation/hooks/useCuentas";
import type { DebtWithInstallments, PersonWithDebts } from "@/application/use-cases/cuentas/getCuentasOverview";
import type { CuentasSnapshot, DebtType } from "@/domain/entities/cuentas";
import { formatCurrency, formatShortDate } from "@/shared/utils/format";
import { evalAmountExpression } from "@/shared/utils/evalAmountExpression";
import { addMonths, formatMonthLabel } from "@/shared/utils/dates";
import { exportStatementImage, exportStatementPdf } from "@/shared/utils/statementExport";
import { cn } from "@/lib/utils";

type CuentasApi = ReturnType<typeof useCuentas>;

export function PersonasTab({ api, persons, totalMeDeben, snapshots }: {
  api: CuentasApi;
  persons: PersonWithDebts[];
  totalMeDeben: number;
  snapshots: CuentasSnapshot[];
}) {
  const [newPersonOpen, setNewPersonOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [detailPerson, setDetailPerson] = useState<PersonWithDebts | null>(null);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editPersonNombre, setEditPersonNombre] = useState("");

  async function handleAddPerson(e: FormEvent) {
    e.preventDefault();
    await api.addPerson.mutateAsync({ nombre });
    setNombre("");
    setNewPersonOpen(false);
  }

  async function saveEditPerson(id: string) {
    if (!editPersonNombre.trim()) return;
    await api.updatePerson.mutateAsync({ id, patch: { nombre: editPersonNombre } });
    setEditingPersonId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <StatCard label="Total que me deben" value={formatCurrency(totalMeDeben)} icon={Users} gradient="cyan" />
        <div className="flex items-center gap-2">
          <SnapshotHistory
            tipo="personas"
            label="personas"
            snapshots={snapshots}
            currentTotal={totalMeDeben}
            currentDetalle={persons.map((p) => ({ nombre: p.nombre, monto: p.totalMeDebe }))}
            onTake={(s) => api.addSnapshot.mutateAsync(s)}
            onDelete={(id) => api.deleteSnapshot.mutateAsync(id)}
          />
          <Dialog open={newPersonOpen} onOpenChange={setNewPersonOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Persona
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddPerson} className="flex flex-col gap-4">
                <DialogHeader>
                  <DialogTitle>Nueva persona</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="p-nombre">Nombre</Label>
                  <Input
                    id="p-nombre"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Guardar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {persons.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sin personas todavía.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {persons.map((p) =>
            editingPersonId === p.id ? (
              <Card key={p.id} className="border-border/60 bg-card/60">
                <CardContent className="flex items-end gap-2 py-4">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label htmlFor={`person-nombre-${p.id}`} className="text-xs">
                      Nombre
                    </Label>
                    <Input
                      id={`person-nombre-${p.id}`}
                      value={editPersonNombre}
                      onChange={(e) => setEditPersonNombre(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-positive hover:text-positive"
                    aria-label="Guardar"
                    onClick={() => saveEditPerson(p.id)}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Cancelar"
                    onClick={() => setEditingPersonId(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card key={p.id} className="border-border/60 bg-card/60">
                <CardContent className="flex items-center justify-between py-4">
                  <button
                    type="button"
                    className="flex flex-1 items-center justify-between text-left"
                    onClick={() => setDetailPerson(p)}
                  >
                    <div>
                      <p className="font-medium text-foreground">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.deudas.length} deuda(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-foreground">
                        <Money value={p.totalMeDebe} />
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 size-7"
                    aria-label="Editar persona"
                    onClick={() => {
                      setEditingPersonId(p.id);
                      setEditPersonNombre(p.nombre);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <DeleteButton
                    ariaLabel="Eliminar persona"
                    className="ml-1"
                    onConfirm={() => api.deletePerson.mutate(p.id)}
                  />
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}

      <Dialog open={detailPerson !== null} onOpenChange={(o) => !o && setDetailPerson(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {detailPerson && (
            <PersonDebts
              person={persons.find((p) => p.id === detailPerson.id) ?? detailPerson}
              api={api}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Lineas del detalle completo de las deudas de una persona, listas para
 * compartir como texto, PDF o imagen. Siempre muestra montos reales sin
 * importar el "ocultar saldos": compartir es una accion explicita de
 * mostrarle esto a alguien mas. */
function buildStatementLines(person: PersonWithDebts): string[] {
  const lines: string[] = [];
  lines.push(`Generado: ${formatShortDate(new Date().toISOString().slice(0, 10))}`);
  lines.push("");
  lines.push(`Total pendiente: ${formatCurrency(person.totalMeDebe)}`);

  if (person.deudas.length === 0) {
    lines.push("");
    lines.push("Sin deudas registradas.");
    return lines;
  }

  for (const [i, d] of person.deudas.entries()) {
    lines.push("");
    lines.push(`${i + 1}. ${d.descripcion}`);
    if (d.tipo === "simple") {
      lines.push(
        `   ${formatCurrency(d.montoTotal)} · ${formatShortDate(d.fechaCreacion)} · ${d.pagada ? "Pagada" : "Pendiente"}`,
      );
    } else {
      lines.push(`   ${d.numCuotas} cuotas de ${formatCurrency(d.montoCuota ?? 0)}`);
      const sortedCuotas = [...d.cuotas].sort((a, b) => a.numero - b.numero);
      for (const c of sortedCuotas) {
        lines.push(
          `   Cuota ${c.numero}/${d.numCuotas} · ${formatShortDate(c.fecha)} · ${formatCurrency(c.monto)} · ${c.pagada ? "Pagada" : "Pendiente"}`,
        );
      }
    }
    lines.push(`   Saldo pendiente: ${formatCurrency(d.saldoPendiente)}`);
  }

  return lines;
}

function buildStatementText(person: PersonWithDebts): string {
  return [`Estado de cuenta - ${person.nombre}`, ...buildStatementLines(person)].join("\n");
}

/** Version corta: solo la cuota que le toca en el mes objetivo (este mes o
 * el siguiente) por cada prestamo a plazos, mas las deudas de monto simple
 * que sigan pendientes (esas no tienen mes, siempre aparecen). Pensado para
 * mandarlo directo por WhatsApp sin el detalle completo. */
function buildSimpleStatementLines(person: PersonWithDebts, monthOffset: number): string[] {
  const lines: string[] = [];
  const targetMonthKey = addMonths(new Date().toISOString().slice(0, 10), monthOffset).slice(0, 7);
  lines.push(`Generado: ${formatShortDate(new Date().toISOString().slice(0, 10))}`);
  lines.push("");

  let total = 0;
  let any = false;

  for (const d of person.deudas) {
    if (d.tipo === "cuotas") {
      const cuotaDelMes = d.cuotas.find((c) => !c.pagada && c.fecha.slice(0, 7) === targetMonthKey);
      if (cuotaDelMes) {
        any = true;
        total += cuotaDelMes.monto;
        lines.push(
          `${d.descripcion}: cuota ${cuotaDelMes.numero}/${d.numCuotas} · ${formatCurrency(cuotaDelMes.monto)}`,
        );
      }
    } else if (!d.pagada) {
      any = true;
      total += d.montoTotal;
      lines.push(`${d.descripcion}: ${formatCurrency(d.montoTotal)}`);
    }
  }

  if (!any) {
    lines.push(`Sin pagos pendientes ${monthOffset === 0 ? "este mes" : "ese mes"}.`);
  } else {
    lines.push("");
    lines.push(`Total: ${formatCurrency(total)}`);
  }

  return lines;
}

function buildSimpleStatementText(person: PersonWithDebts, monthOffset: number): string {
  const targetMonthKey = addMonths(new Date().toISOString().slice(0, 10), monthOffset).slice(0, 7);
  return [
    `Pagos de ${person.nombre} - ${formatMonthLabel(targetMonthKey)}`,
    ...buildSimpleStatementLines(person, monthOffset),
  ].join("\n");
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

function shareStatement(person: PersonWithDebts) {
  return shareText(`Estado de cuenta - ${person.nombre}`, buildStatementText(person));
}

function shareSimpleStatement(person: PersonWithDebts, monthOffset: number) {
  return shareText(`Pagos de ${person.nombre}`, buildSimpleStatementText(person, monthOffset));
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function exportStatementAsPdf(person: PersonWithDebts) {
  return exportStatementPdf(
    `Estado de cuenta - ${person.nombre}`,
    buildStatementLines(person),
    `estado-de-cuenta-${slug(person.nombre)}.pdf`,
  );
}

function exportStatementAsImage(person: PersonWithDebts) {
  return exportStatementImage(
    `Estado de cuenta - ${person.nombre}`,
    buildStatementLines(person),
    `estado-de-cuenta-${slug(person.nombre)}.png`,
  );
}

function exportSimpleStatementAsPdf(person: PersonWithDebts, monthOffset: number) {
  const targetMonthKey = addMonths(new Date().toISOString().slice(0, 10), monthOffset).slice(0, 7);
  return exportStatementPdf(
    `Pagos de ${person.nombre} - ${formatMonthLabel(targetMonthKey)}`,
    buildSimpleStatementLines(person, monthOffset),
    `pagos-${slug(person.nombre)}-${targetMonthKey}.pdf`,
  );
}

function exportSimpleStatementAsImage(person: PersonWithDebts, monthOffset: number) {
  const targetMonthKey = addMonths(new Date().toISOString().slice(0, 10), monthOffset).slice(0, 7);
  return exportStatementImage(
    `Pagos de ${person.nombre} - ${formatMonthLabel(targetMonthKey)}`,
    buildSimpleStatementLines(person, monthOffset),
    `pagos-${slug(person.nombre)}-${targetMonthKey}.png`,
  );
}

function PersonDebts({ person, api }: { person: PersonWithDebts; api: CuentasApi }) {
  const [addOpen, setAddOpen] = useState(false);
  const { isHidden } = useHiddenBalances();
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editMontoTotal, setEditMontoTotal] = useState("");
  const [editFecha, setEditFecha] = useState("");

  function startEditDebt(d: DebtWithInstallments) {
    setEditingDebtId(d.id);
    setEditDescripcion(d.descripcion);
    setEditMontoTotal(String(d.montoTotal));
    setEditFecha(d.fechaCreacion);
  }

  const editMontoTotalValue = evalAmountExpression(editMontoTotal);

  async function saveEditDebt(d: DebtWithInstallments) {
    if (editMontoTotalValue === null && d.tipo === "simple") return;
    if (d.tipo === "simple") {
      await api.updateDebt.mutateAsync({
        id: d.id,
        patch: {
          descripcion: editDescripcion,
          montoTotal: editMontoTotalValue as number,
          fechaCreacion: editFecha,
        },
      });
    } else {
      await api.updateDebt.mutateAsync({ id: d.id, patch: { descripcion: editDescripcion } });
      if (editFecha !== d.fechaCreacion) {
        await api.updateInstallmentDates.mutateAsync({
          debtId: d.id,
          cuotas: d.cuotas,
          fechaInicial: editFecha,
        });
      }
    }
    setEditingDebtId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Deudas de {person.nombre}</DialogTitle>
      </DialogHeader>

      <div className="flex flex-wrap gap-2">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="secondary" className="self-start">
            <Plus className="size-4" />
            Nueva deuda
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DebtForm
            personaId={person.id}
            api={api}
            onDone={() => setAddOpen(false)}
          />
        </DialogContent>
        </Dialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Share2 className="size-4" />
              Compartir estado de cuenta
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => shareStatement(person)}>Texto (WhatsApp)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportStatementAsPdf(person)}>PDF</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportStatementAsImage(person)}>Imagen</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Share2 className="size-4" />
              Compartir pago del mes
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Este mes</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => shareSimpleStatement(person, 0)}>
                  Texto (WhatsApp)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportSimpleStatementAsPdf(person, 0)}>
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportSimpleStatementAsImage(person, 0)}>
                  Imagen
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Próximo mes</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => shareSimpleStatement(person, 1)}>
                  Texto (WhatsApp)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportSimpleStatementAsPdf(person, 1)}>
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportSimpleStatementAsImage(person, 1)}>
                  Imagen
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {person.deudas.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Sin deudas registradas.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {person.deudas.map((d) =>
            editingDebtId === d.id ? (
              <li key={d.id} className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`debt-desc-${d.id}`} className="text-xs">
                    Descripción
                  </Label>
                  <Input
                    id={`debt-desc-${d.id}`}
                    value={editDescripcion}
                    onChange={(e) => setEditDescripcion(e.target.value)}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label htmlFor={`debt-fecha-${d.id}`} className="text-xs">
                      {d.tipo === "cuotas" ? "Fecha inicial" : "Fecha"}
                    </Label>
                    <DatePicker id={`debt-fecha-${d.id}`} value={editFecha} onChange={setEditFecha} />
                  </div>
                  {d.tipo === "simple" && (
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Label htmlFor={`debt-monto-${d.id}`} className="text-xs">
                        Monto
                      </Label>
                      <AmountInput id={`debt-monto-${d.id}`} value={editMontoTotal} onChange={setEditMontoTotal} />
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-positive hover:text-positive"
                    aria-label="Guardar"
                    disabled={d.tipo === "simple" && editMontoTotalValue === null}
                    onClick={() => saveEditDebt(d)}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Cancelar"
                    onClick={() => setEditingDebtId(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </li>
            ) : (
            <li key={d.id} className="rounded-md border border-border/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{d.descripcion}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.tipo === "cuotas"
                      ? `${d.numCuotas} cuotas de ${isHidden ? "••••••" : formatCurrency(d.montoCuota ?? 0)}`
                      : "Monto simple"}{" "}
                    · {formatShortDate(d.fechaCreacion)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm tabular-nums text-foreground">
                    <Money value={d.saldoPendiente} />
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Editar deuda"
                    onClick={() => startEditDebt(d)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <DeleteButton ariaLabel="Eliminar deuda" onConfirm={() => api.deleteDebt.mutate(d.id)} />
                </div>
              </div>

              {d.tipo === "simple" ? (
                <button
                  type="button"
                  onClick={() =>
                    api.toggleDebtPaid.mutate({ id: d.id, pagada: !d.pagada })
                  }
                  className="mt-2 flex items-center gap-2 text-left text-xs"
                >
                  <span
                    className={cn(
                      "size-3 rounded-full border",
                      d.pagada ? "border-positive bg-positive" : "border-muted-foreground",
                    )}
                  />
                  <span className={cn("text-muted-foreground", d.pagada && "line-through")}>
                    Liquidada
                  </span>
                </button>
              ) : (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {d.cuotas
                    .sort((a, b) => a.numero - b.numero)
                    .map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          title={isHidden ? undefined : formatCurrency(c.monto)}
                          onClick={() =>
                            api.toggleInstallmentPaid.mutate({ id: c.id, pagada: !c.pagada })
                          }
                          className={cn(
                            "flex flex-col items-center justify-center gap-0.5 rounded-md border px-2 py-1 leading-none",
                            c.pagada
                              ? "border-positive bg-positive/20 text-positive"
                              : "border-border text-muted-foreground",
                          )}
                        >
                          <span className="text-[11px] font-medium">#{c.numero}</span>
                          <span className="text-[10px] opacity-80">{formatShortDate(c.fecha)}</span>
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DebtForm({
  personaId,
  api,
  onDone,
}: {
  personaId: string;
  api: CuentasApi;
  onDone: () => void;
}) {
  const [tipo, setTipo] = useState<DebtType>("simple");
  const [descripcion, setDescripcion] = useState("");
  const [montoTotal, setMontoTotal] = useState("");
  const [numCuotas, setNumCuotas] = useState("12");
  const [montoCuota, setMontoCuota] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const montoTotalValue = evalAmountExpression(montoTotal);
  const montoCuotaValue = evalAmountExpression(montoCuota);
  const canSubmit = tipo === "simple" ? montoTotalValue !== null : montoCuotaValue !== null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      if (tipo === "simple") {
        await api.addSimpleDebt.mutateAsync({
          personaId,
          tipo: "simple",
          descripcion,
          montoTotal: montoTotalValue as number,
          fechaCreacion: fecha,
          pagada: false,
        });
      } else {
        await api.addInstallmentDebt.mutateAsync({
          personaId,
          descripcion,
          numCuotas: Number(numCuotas),
          montoCuota: montoCuotaValue as number,
          fechaPrimeraCuota: fecha,
        });
      }
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Nueva deuda</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <Label>Tipo</Label>
        <Select value={tipo} onValueChange={(v) => setTipo(v as DebtType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="simple">Monto simple</SelectItem>
            <SelectItem value="cuotas">Plan de cuotas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="d-desc">Descripción</Label>
        <Input
          id="d-desc"
          required
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      {tipo === "simple" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="d-monto">Monto (MXN)</Label>
          <AmountInput id="d-monto" required value={montoTotal} onChange={setMontoTotal} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="d-numcuotas"># de cuotas</Label>
            <Input
              id="d-numcuotas"
              type="number"
              min="1"
              required
              value={numCuotas}
              onChange={(e) => setNumCuotas(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="d-montocuota">Monto por cuota</Label>
            <AmountInput id="d-montocuota" required value={montoCuota} onChange={setMontoCuota} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="d-fecha">
          {tipo === "simple" ? "Fecha" : "Fecha de la primera cuota"}
        </Label>
        <DatePicker id="d-fecha" value={fecha} onChange={setFecha} />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={submitting || !canSubmit}>
          {submitting ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
