import type { PortfolioSnapshot } from "@/domain/entities/dashboard";

export interface ISnapshotRepository {
  listSnapshots(uid: string): Promise<PortfolioSnapshot[]>;
}
