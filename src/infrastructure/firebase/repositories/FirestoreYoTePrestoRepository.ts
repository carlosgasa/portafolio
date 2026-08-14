import type { IYoTePrestoRepository } from "@/domain/repositories/IYoTePrestoRepository";
import type { AccountValuePoint } from "@/domain/entities/yotepresto";
import type { Movement } from "@/domain/entities/common";
import { addItem, deleteItem, listAll } from "@/infrastructure/firebase/crud";

const VALUES = "yotePrestoValores";
const MOVEMENTS = "yotePrestoMovimientos";

export class FirestoreYoTePrestoRepository implements IYoTePrestoRepository {
  listValues(uid: string) {
    return listAll<Omit<AccountValuePoint, "id">>(uid, VALUES);
  }

  addValue(uid: string, point: Omit<AccountValuePoint, "id">) {
    return addItem(uid, VALUES, point).then(() => undefined);
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

  deleteMovement(uid: string, id: string) {
    return deleteItem(uid, MOVEMENTS, id);
  }
}
