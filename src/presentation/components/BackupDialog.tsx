import { useState, type ChangeEvent } from "react";
import { DatabaseBackup, Download, Upload, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/presentation/providers/AuthProvider";
import {
  buildBackup,
  diffBackup,
  fetchAllCollections,
  isBackupFile,
  restoreBackup,
  type BackupCollectionDiff,
} from "@/infrastructure/firebase/backupService";
import { BACKUP_COLLECTIONS } from "@/infrastructure/firebase/backupCollections";
import type { BackupFile } from "@/domain/entities/backup";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function BackupDialog() {
  const { user } = useAuth();
  const uid = user?.uid as string;
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Backup de datos" title="Backup de datos">
          <DatabaseBackup className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Backup de datos</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="export" className="min-h-0 flex-1 overflow-y-auto">
          <TabsList>
            <TabsTrigger value="export">Exportar</TabsTrigger>
            <TabsTrigger value="restore">Restaurar</TabsTrigger>
          </TabsList>
          <TabsContent value="export" className="mt-4">
            <ExportTab uid={uid} />
          </TabsContent>
          <TabsContent value="restore" className="mt-4">
            <RestoreTab uid={uid} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ExportTab({ uid }: { uid: string }) {
  const [loading, setLoading] = useState(false);
  const [backup, setBackup] = useState<BackupFile | null>(null);

  async function handlePreview() {
    setLoading(true);
    try {
      setBackup(await buildBackup(uid));
    } catch {
      toast.error("No se pudo leer la base de datos");
    } finally {
      setLoading(false);
    }
  }

  const summary = backup
    ? BACKUP_COLLECTIONS.map(({ name, label }) => ({
        name,
        label,
        count: backup.collections[name]?.length ?? 0,
      })).filter((c) => c.count > 0)
    : [];
  const total = summary.reduce((s, c) => s + c.count, 0);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Lee todas tus colecciones de Firestore y arma un archivo .json con todo, listo para
        descargar. Es solo lectura, no modifica nada.
      </p>
      <Button onClick={handlePreview} disabled={loading} className="self-start">
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <DatabaseBackup className="size-4" />
        )}
        {backup ? "Actualizar vista previa" : "Generar vista previa"}
      </Button>

      {backup && (
        <>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <tbody>
                {summary.map((c) => (
                  <tr key={c.name} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-1.5 text-muted-foreground">{c.label}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-foreground">
                      {c.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            {total} documentos en total · generado{" "}
            {new Date(backup.exportedAt).toLocaleString("es-MX")}
          </p>
          <Button
            variant="outline"
            className="self-start"
            onClick={() =>
              downloadJson(`portafolio-backup-${backup.exportedAt.slice(0, 10)}.json`, backup)
            }
          >
            <Download className="size-4" />
            Descargar backup.json
          </Button>
        </>
      )}
    </div>
  );
}

function RestoreTab({ uid }: { uid: string }) {
  const [file, setFile] = useState<BackupFile | null>(null);
  const [diff, setDiff] = useState<BackupCollectionDiff[] | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [done, setDone] = useState(false);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setFile(null);
    setDiff(null);
    setConfirming(false);
    setDone(false);
    try {
      const parsed: unknown = JSON.parse(await f.text());
      if (!isBackupFile(parsed)) {
        toast.error("El archivo no tiene el formato de un backup válido");
        return;
      }
      setFile(parsed);
      setLoadingDiff(true);
      const current = await fetchAllCollections(uid);
      setDiff(diffBackup(parsed, current));
    } catch {
      toast.error("No se pudo leer el archivo");
    } finally {
      setLoadingDiff(false);
    }
  }

  async function handleRestore() {
    if (!file) return;
    setRestoring(true);
    setProgress({ done: 0, total: 0 });
    try {
      await restoreBackup(uid, file, (d, t) => setProgress({ done: d, total: t }));
      toast.success("Backup restaurado");
      setDone(true);
      setConfirming(false);
    } catch {
      toast.error("Ocurrió un error restaurando el backup");
    } finally {
      setRestoring(false);
    }
  }

  const totalNuevos = diff?.reduce((s, d) => s + d.nuevos, 0) ?? 0;
  const totalActualizados = diff?.reduce((s, d) => s + d.actualizados, 0) ?? 0;
  const totalSinCambios = diff?.reduce((s, d) => s + d.sinCambios, 0) ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Selecciona un archivo .json generado con "Exportar". Esto{" "}
        <span className="text-foreground">nunca borra</span> documentos existentes que no estén en
        el backup: solo crea los que faltan y sobrescribe por ID los que coincidan.
      </p>
      <input
        type="file"
        accept="application/json,.json"
        onChange={handleFile}
        className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:text-foreground"
      />

      {loadingDiff && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Comparando con tus datos actuales…
        </p>
      )}

      {diff && !loadingDiff && (
        <>
          <div className="max-h-56 overflow-y-auto rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-xs text-muted-foreground">
                  <th className="px-3 py-1.5 text-left font-medium">Colección</th>
                  <th className="px-3 py-1.5 text-right font-medium">Nuevos</th>
                  <th className="px-3 py-1.5 text-right font-medium">Actualizados</th>
                  <th className="px-3 py-1.5 text-right font-medium">Sin cambios</th>
                </tr>
              </thead>
              <tbody>
                {diff.map((d) => (
                  <tr key={d.name} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-1.5 text-muted-foreground">{d.label}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-positive">
                      {d.nuevos || "—"}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-[var(--chart-4)]">
                      {d.actualizados || "—"}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                      {d.sinCambios || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            {totalNuevos} nuevos, {totalActualizados} se sobrescribirán, {totalSinCambios} sin
            cambios.
          </p>

          {done ? (
            <p className="text-sm text-positive">Restauración completa.</p>
          ) : restoring ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Restaurando {progress?.done ?? 0} de {progress?.total ?? 0}…
            </p>
          ) : confirming ? (
            <div className="flex items-center gap-2 rounded-lg border border-negative/40 bg-negative/10 p-3">
              <AlertTriangle className="size-4 shrink-0 text-negative" />
              <p className="flex-1 text-sm text-foreground">
                Esto sobrescribirá {totalActualizados} documento(s) existentes. ¿Confirmas?
              </p>
              <Button
                size="sm"
                variant="outline"
                className="border-negative/40 text-negative"
                onClick={handleRestore}
              >
                Sí, restaurar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="self-start border-negative/40 text-negative"
              onClick={() => setConfirming(true)}
              disabled={totalNuevos + totalActualizados === 0}
            >
              <Upload className="size-4" />
              Restaurar backup
            </Button>
          )}
        </>
      )}
    </div>
  );
}
