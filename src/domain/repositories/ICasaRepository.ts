import type { ExpenseItem } from "@/domain/entities/casa";

export interface ICasaRepository {
  listExpenses(uid: string): Promise<ExpenseItem[]>;
  addExpense(uid: string, item: Omit<ExpenseItem, "id">): Promise<void>;
  updateExpense(uid: string, id: string, patch: Partial<Omit<ExpenseItem, "id">>): Promise<void>;
  deleteExpense(uid: string, id: string): Promise<void>;
}
