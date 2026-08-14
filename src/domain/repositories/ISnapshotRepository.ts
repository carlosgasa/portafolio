import type { PortfolioSnapshot } from "@/domain/entities/dashboard";

export interface ISnapshotRepository {
  listSnapshots(uid: string): Promise<PortfolioSnapshot[]>;
  /** Crea o sobreescribe (por fecha) el snapshot semanal. */
  saveSnapshot(uid: string, snapshot: PortfolioSnapshot): Promise<void>;
}
