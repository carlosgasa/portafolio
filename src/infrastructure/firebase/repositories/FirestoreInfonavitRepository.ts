import type { IInfonavitRepository } from "@/domain/repositories/IInfonavitRepository";
import type { InfonavitBalancePoint } from "@/domain/entities/infonavit";
import { addItem, deleteItem, listAll, updateItem } from "@/infrastructure/firebase/crud";

const BALANCES = "infonavitSaldos";

export class FirestoreInfonavitRepository implements IInfonavitRepository {
  listBalances(uid: string) {
    return listAll<Omit<InfonavitBalancePoint, "id">>(uid, BALANCES);
  }

  addBalance(uid: string, point: Omit<InfonavitBalancePoint, "id">) {
    return addItem(uid, BALANCES, point).then(() => undefined);
  }

  updateBalance(uid: string, id: string, patch: Partial<Omit<InfonavitBalancePoint, "id">>) {
    return updateItem(uid, BALANCES, id, patch);
  }

  deleteBalance(uid: string, id: string) {
    return deleteItem(uid, BALANCES, id);
  }
}
