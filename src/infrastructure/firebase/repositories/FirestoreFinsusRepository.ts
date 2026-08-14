import type { IFinsusRepository } from "@/domain/repositories/IFinsusRepository";
import type { FixedTermAccount } from "@/domain/entities/finsus";
import type { Movement } from "@/domain/entities/common";
import { addItem, deleteItem, listAll, updateItem } from "@/infrastructure/firebase/crud";

const ACCOUNTS = "finsusCuentas";
const MOVEMENTS = "finsusMovimientos";

export class FirestoreFinsusRepository implements IFinsusRepository {
  listAccounts(uid: string) {
    return listAll<Omit<FixedTermAccount, "id">>(uid, ACCOUNTS);
  }

  addAccount(uid: string, account: Omit<FixedTermAccount, "id">) {
    return addItem(uid, ACCOUNTS, account).then(() => undefined);
  }

  updateAccount(uid: string, id: string, patch: Partial<Omit<FixedTermAccount, "id">>) {
    return updateItem(uid, ACCOUNTS, id, patch);
  }

  deleteAccount(uid: string, id: string) {
    return deleteItem(uid, ACCOUNTS, id);
  }

  listMovements(uid: string) {
    return listAll<Omit<Movement, "id">>(uid, MOVEMENTS);
  }

  addMovement(uid: string, movement: Omit<Movement, "id">) {
    return addItem(uid, MOVEMENTS, movement).then(() => undefined);
  }

  updateMovement(uid: string, id: string, patch: Partial<Omit<Movement, "id">>) {
    return updateItem(uid, MOVEMENTS, id, patch);
  }

  deleteMovement(uid: string, id: string) {
    return deleteItem(uid, MOVEMENTS, id);
  }
}
