import type { AccountValuePoint } from "@/domain/entities/yotepresto";
import type { Movement } from "@/domain/entities/common";

export interface IYoTePrestoRepository {
  listValues(uid: string): Promise<AccountValuePoint[]>;
  addValue(uid: string, point: Omit<AccountValuePoint, "id">): Promise<void>;
  updateValue(uid: string, id: string, patch: Partial<Omit<AccountValuePoint, "id">>): Promise<void>;
  deleteValue(uid: string, id: string): Promise<void>;

  listMovements(uid: string): Promise<Movement[]>;
  addMovement(uid: string, movement: Omit<Movement, "id">): Promise<void>;
  updateMovement(uid: string, id: string, patch: Partial<Omit<Movement, "id">>): Promise<void>;
  deleteMovement(uid: string, id: string): Promise<void>;
}
