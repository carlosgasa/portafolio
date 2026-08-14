import type { IYoTePrestoRepository } from "@/domain/repositories/IYoTePrestoRepository";
import type { AccountValuePoint } from "@/domain/entities/yotepresto";
import type { Movement } from "@/domain/entities/common";
import { addItem, deleteItem, listAll, updateItem } from "@/infrastructure/firebase/crud";

const VALUES = "yotePrestoValores";
const MOVEMENTS = "yotePrestoMovimientos";

export class FirestoreYoTePrestoRepository implements IYoTePrestoRepository {
  listValues(uid: string) {
    return listAll<Omit<AccountValuePoint, "id">>(uid, VALUES);
  }

  addValue(uid: string, point: Omit<AccountValuePoint, "id">) {
    return addItem(uid, VALUES, point).then(() => undefined);
  }

  updateValue(uid: string, id: string, patch: Partial<Omit<AccountValuePoint, "id">>) {
    return updateItem(uid, VALUES, id, patch);
  }

  deleteValue(uid: string, id: string) {
    return deleteItem(uid, VALUES, id);
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
