export type BackupDoc = Record<string, unknown> & { id: string };

export interface BackupFile {
  version: 1;
  exportedAt: string;
  uid: string;
  collections: Record<string, BackupDoc[]>;
}
