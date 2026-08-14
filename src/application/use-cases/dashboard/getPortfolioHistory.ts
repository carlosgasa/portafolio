import type { ISnapshotRepository } from "@/domain/repositories/ISnapshotRepository";
import type { PortfolioSnapshot } from "@/domain/entities/dashboard";

export interface PortfolioHistory {
  snapshots: PortfolioSnapshot[];
  latest: PortfolioSnapshot | null;
  previous: PortfolioSnapshot | null;
}

export async function getPortfolioHistory(
  repo: ISnapshotRepository,
  uid: string,
): Promise<PortfolioHistory> {
  const snapshots = await repo.listSnapshots(uid);
  return {
    snapshots,
    latest: snapshots.at(-1) ?? null,
    previous: snapshots.length > 1 ? snapshots[snapshots.length - 2] : null,
  };
}
