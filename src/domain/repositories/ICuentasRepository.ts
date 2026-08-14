import type {
  CardPayment,
  CreditCard,
  CuentasSnapshot,
  Debt,
  Installment,
  LiquidBalance,
  Person,
} from "@/domain/entities/cuentas";

export interface ICuentasRepository {
  listCards(uid: string): Promise<CreditCard[]>;
  addCard(uid: string, card: Omit<CreditCard, "id">): Promise<void>;
  updateCard(uid: string, id: string, patch: Partial<Omit<CreditCard, "id">>): Promise<void>;
  deleteCard(uid: string, id: string): Promise<void>;

  listCardPayments(uid: string): Promise<CardPayment[]>;
  addCardPayment(uid: string, payment: Omit<CardPayment, "id">): Promise<void>;
  updateCardPayment(
    uid: string,
    id: string,
    patch: Partial<Omit<CardPayment, "id">>,
  ): Promise<void>;
  deleteCardPayment(uid: string, id: string): Promise<void>;

  listPersons(uid: string): Promise<Person[]>;
  addPerson(uid: string, person: Omit<Person, "id">): Promise<void>;
  updatePerson(uid: string, id: string, patch: Partial<Omit<Person, "id">>): Promise<void>;
  deletePerson(uid: string, id: string): Promise<void>;

  listDebts(uid: string): Promise<Debt[]>;
  addDebt(uid: string, debt: Omit<Debt, "id">): Promise<string>;
  updateDebt(uid: string, id: string, patch: Partial<Omit<Debt, "id">>): Promise<void>;
  deleteDebt(uid: string, id: string): Promise<void>;

  listInstallments(uid: string): Promise<Installment[]>;
  addInstallment(uid: string, installment: Omit<Installment, "id">): Promise<void>;
  updateInstallment(
    uid: string,
    id: string,
    patch: Partial<Omit<Installment, "id">>,
  ): Promise<void>;

  listLiquidBalances(uid: string): Promise<LiquidBalance[]>;
  addLiquidBalance(uid: string, balance: Omit<LiquidBalance, "id">): Promise<void>;
  updateLiquidBalance(
    uid: string,
    id: string,
    patch: Partial<Omit<LiquidBalance, "id">>,
  ): Promise<void>;
  deleteLiquidBalance(uid: string, id: string): Promise<void>;

  listSnapshots(uid: string): Promise<CuentasSnapshot[]>;
  addSnapshot(uid: string, snapshot: Omit<CuentasSnapshot, "id">): Promise<void>;
  deleteSnapshot(uid: string, id: string): Promise<void>;
}
