import type { ICasaRepository } from "@/domain/repositories/ICasaRepository";
import type { ExpenseItem } from "@/domain/entities/casa";
import { addItem, deleteItem, listAll, updateItem } from "@/infrastructure/firebase/crud";

const EXPENSES = "casaGastos";

export class FirestoreCasaRepository implements ICasaRepository {
  listExpenses(uid: string) {
    return listAll<Omit<ExpenseItem, "id">>(uid, EXPENSES);
  }

  addExpense(uid: string, item: Omit<ExpenseItem, "id">) {
    return addItem(uid, EXPENSES, item).then(() => undefined);
  }

  updateExpense(uid: string, id: string, patch: Partial<Omit<ExpenseItem, "id">>) {
    return updateItem(uid, EXPENSES, id, patch);
  }

  deleteExpense(uid: string, id: string) {
    return deleteItem(uid, EXPENSES, id);
  }
}
