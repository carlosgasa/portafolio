import type { AforeBalancePoint } from "@/domain/entities/afore";

export interface IAforeRepository {
  listBalances(uid: string): Promise<AforeBalancePoint[]>;
  addBalance(uid: string, point: Omit<AforeBalancePoint, "id">): Promise<void>;
  updateBalance(uid: string, id: string, patch: Partial<Omit<AforeBalancePoint, "id">>): Promise<void>;
  deleteBalance(uid: string, id: string): Promise<void>;
}
