import type { InfonavitBalancePoint } from "@/domain/entities/infonavit";

export interface IInfonavitRepository {
  listBalances(uid: string): Promise<InfonavitBalancePoint[]>;
  addBalance(uid: string, point: Omit<InfonavitBalancePoint, "id">): Promise<void>;
  updateBalance(
    uid: string,
    id: string,
    patch: Partial<Omit<InfonavitBalancePoint, "id">>,
  ): Promise<void>;
  deleteBalance(uid: string, id: string): Promise<void>;
}
