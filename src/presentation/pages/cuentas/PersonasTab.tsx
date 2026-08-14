import { useState, type FormEvent } from "react";
import { Plus, Users, ChevronRight } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/presentation/components/StatCard";
import { DeleteButton } from "@/presentation/components/DeleteButton";
import { SnapshotHistory } from "@/presentation/components/SnapshotHistory";
import type { useCuentas } from "@/presentation/hooks/useCuentas";
import type { PersonWithDebts } from "@/application/use-cases/cuentas/getCuentasOverview";
import type { CuentasSnapshot, DebtType } from "@/domain/entities/cuentas";
import { formatCurrency, formatShortDate } from "@/shared/utils/format";
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

  async function handleAddPerson(e: FormEvent) {
    e.preventDefault();
    await api.addPerson.mutateAsync({ nombre });
    setNombre("");
    setNewPersonOpen(false);
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
          {persons.map((p) => (
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
                      {formatCurrency(p.totalMeDebe)}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </button>
                <DeleteButton
                  ariaLabel="Eliminar persona"
                  className="ml-2"
                  onConfirm={() => api.deletePerson.mutate(p.id)}
                />
              </CardContent>
            </Card>
          ))}
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

function PersonDebts({ person, api }: { person: PersonWithDebts; api: CuentasApi }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Deudas de {person.nombre}</DialogTitle>
      </DialogHeader>

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

      {person.deudas.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Sin deudas registradas.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {person.deudas.map((d) => (
            <li key={d.id} className="rounded-md border border-border/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{d.descripcion}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.tipo === "cuotas"
                      ? `${d.numCuotas} cuotas de ${formatCurrency(d.montoCuota ?? 0)}`
                      : "Monto simple"}{" "}
                    · {formatShortDate(d.fechaCreacion)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm tabular-nums text-foreground">
                    {formatCurrency(d.saldoPendiente)}
                  </span>
                  <DeleteButton ariaLabel="Eliminar deuda" onConfirm={() => api.deleteDebt.mutate(d.id)} />
                </div>
              </div>

              {d.tipo === "simple" ? (
                <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={!!d.pagada}
                    onChange={(e) =>
                      api.toggleDebtPaid.mutate({ id: d.id, pagada: e.target.checked })
                    }
                    className="accent-primary"
                  />
                  Liquidada
                </label>
              ) : (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {d.cuotas
                    .sort((a, b) => a.numero - b.numero)
                    .map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          title={`${formatShortDate(c.fecha)} · ${formatCurrency(c.monto)}`}
                          onClick={() =>
                            api.toggleInstallmentPaid.mutate({ id: c.id, pagada: !c.pagada })
                          }
                          className={cn(
                            "flex size-7 items-center justify-center rounded-full border text-[11px] font-medium",
                            c.pagada
                              ? "border-positive bg-positive/20 text-positive"
                              : "border-border text-muted-foreground",
                          )}
                        >
                          {c.numero}
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (tipo === "simple") {
        await api.addSimpleDebt.mutateAsync({
          personaId,
          tipo: "simple",
          descripcion,
          montoTotal: Number(montoTotal),
          fechaCreacion: fecha,
          pagada: false,
        });
      } else {
        await api.addInstallmentDebt.mutateAsync({
          personaId,
          descripcion,
          numCuotas: Number(numCuotas),
          montoCuota: Number(montoCuota),
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
          <Input
            id="d-monto"
            type="number"
            step="any"
            required
            value={montoTotal}
            onChange={(e) => setMontoTotal(e.target.value)}
          />
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
            <Input
              id="d-montocuota"
              type="number"
              step="any"
              required
              value={montoCuota}
              onChange={(e) => setMontoCuota(e.target.value)}
            />
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
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
