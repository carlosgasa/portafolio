import type { IAforeRepository } from "@/domain/repositories/IAforeRepository";
import type { AforeBalancePoint } from "@/domain/entities/afore";
import { addItem, deleteItem, listAll, updateItem } from "@/infrastructure/firebase/crud";

const BALANCES = "aforeValores";

export class FirestoreAforeRepository implements IAforeRepository {
  listBalances(uid: string) {
    return listAll<Omit<AforeBalancePoint, "id">>(uid, BALANCES);
  }

  addBalance(uid: string, point: Omit<AforeBalancePoint, "id">) {
    return addItem(uid, BALANCES, point).then(() => undefined);
  }

  updateBalance(uid: string, id: string, patch: Partial<Omit<AforeBalancePoint, "id">>) {
    return updateItem(uid, BALANCES, id, patch);
  }

  deleteBalance(uid: string, id: string) {
    return deleteItem(uid, BALANCES, id);
  }
}
