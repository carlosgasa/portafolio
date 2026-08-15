import { listAll, setItem } from "@/infrastructure/firebase/crud";
import { BACKUP_COLLECTIONS } from "@/infrastructure/firebase/backupCollections";
import type { BackupDoc, BackupFile } from "@/domain/entities/backup";

export async function fetchAllCollections(uid: string): Promise<Record<string, BackupDoc[]>> {
  const entries = await Promise.all(
    BACKUP_COLLECTIONS.map(async ({ name }) => {
      const docs = await listAll<Record<string, unknown>>(uid, name);
      return [name, docs] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export async function buildBackup(uid: string): Promise<BackupFile> {
  const collections = await fetchAllCollections(uid);
  return { version: 1, exportedAt: new Date().toISOString(), uid, collections };
}

export function isBackupFile(value: unknown): value is BackupFile {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.version !== 1 || typeof v.collections !== "object" || v.collections === null) return false;
  return Object.values(v.collections).every(
    (docs) => Array.isArray(docs) && docs.every((d) => typeof d === "object" && d !== null && "id" in d),
  );
}

/** Serializa ordenando las llaves, solo para comparar contenido sin que el
 * orden de propiedades genere falsos "cambiados". */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export interface BackupCollectionDiff {
  name: string;
  label: string;
  nuevos: number;
  actualizados: number;
  sinCambios: number;
  total: number;
}

export function diffBackup(
  backup: BackupFile,
  current: Record<string, BackupDoc[]>,
): BackupCollectionDiff[] {
  return BACKUP_COLLECTIONS.map(({ name, label }) => {
    const backupDocs = backup.collections[name] ?? [];
    const currentById = new Map((current[name] ?? []).map((d) => [d.id, d]));
    let nuevos = 0;
    let actualizados = 0;
    let sinCambios = 0;
    for (const doc of backupDocs) {
      const existing = currentById.get(doc.id);
      if (!existing) {
        nuevos++;
      } else if (stableStringify(existing) !== stableStringify(doc)) {
        actualizados++;
      } else {
        sinCambios++;
      }
    }
    return { name, label, nuevos, actualizados, sinCambios, total: backupDocs.length };
  }).filter((d) => d.total > 0);
}

/** Escribe cada documento del backup por su ID original (crea o
 * sobrescribe). Nunca borra documentos existentes que no esten en el
 * backup: es un restore aditivo, no un reemplazo total. */
export async function restoreBackup(
  uid: string,
  backup: BackupFile,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const total = BACKUP_COLLECTIONS.reduce(
    (s, { name }) => s + (backup.collections[name]?.length ?? 0),
    0,
  );
  let done = 0;
  for (const { name } of BACKUP_COLLECTIONS) {
    const docs = backup.collections[name] ?? [];
    await Promise.all(
      docs.map(async ({ id, ...data }) => {
        await setItem(uid, name, id, data);
        done++;
        onProgress?.(done, total);
      }),
    );
  }
}
