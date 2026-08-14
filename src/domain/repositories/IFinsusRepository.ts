import type { FixedTermAccount } from "@/domain/entities/finsus";
import type { Movement } from "@/domain/entities/common";

export interface IFinsusRepository {
  listAccounts(uid: string): Promise<FixedTermAccount[]>;
  addAccount(uid: string, account: Omit<FixedTermAccount, "id">): Promise<void>;
  updateAccount(
    uid: string,
    id: string,
    patch: Partial<Omit<FixedTermAccount, "id">>,
  ): Promise<void>;
  deleteAccount(uid: string, id: string): Promise<void>;

  listMovements(uid: string): Promise<Movement[]>;
  addMovement(uid: string, movement: Omit<Movement, "id">): Promise<void>;
  deleteMovement(uid: string, id: string): Promise<void>;
}
