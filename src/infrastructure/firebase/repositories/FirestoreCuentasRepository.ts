import type { ICuentasRepository } from "@/domain/repositories/ICuentasRepository";
import type {
  CardPayment,
  CreditCard,
  CuentasSnapshot,
  Debt,
  Installment,
  LiquidBalance,
  Person,
} from "@/domain/entities/cuentas";
import { addItem, deleteItem, listAll, updateItem } from "@/infrastructure/firebase/crud";

const CARDS = "tarjetas";
const CARD_PAYMENTS = "tarjetaPagos";
const PERSONS = "personas";
const DEBTS = "deudas";
const INSTALLMENTS = "cuotas";
const LIQUID = "liquidez";
const SNAPSHOTS = "cuentasSnapshots";

export class FirestoreCuentasRepository implements ICuentasRepository {
  listCards(uid: string) {
    return listAll<Omit<CreditCard, "id">>(uid, CARDS);
  }
  addCard(uid: string, card: Omit<CreditCard, "id">) {
    return addItem(uid, CARDS, card).then(() => undefined);
  }
  updateCard(uid: string, id: string, patch: Partial<Omit<CreditCard, "id">>) {
    return updateItem(uid, CARDS, id, patch);
  }
  deleteCard(uid: string, id: string) {
    return deleteItem(uid, CARDS, id);
  }

  listCardPayments(uid: string) {
    return listAll<Omit<CardPayment, "id">>(uid, CARD_PAYMENTS);
  }
  addCardPayment(uid: string, payment: Omit<CardPayment, "id">) {
    return addItem(uid, CARD_PAYMENTS, payment).then(() => undefined);
  }
  updateCardPayment(uid: string, id: string, patch: Partial<Omit<CardPayment, "id">>) {
    return updateItem(uid, CARD_PAYMENTS, id, patch);
  }
  deleteCardPayment(uid: string, id: string) {
    return deleteItem(uid, CARD_PAYMENTS, id);
  }

  listPersons(uid: string) {
    return listAll<Omit<Person, "id">>(uid, PERSONS);
  }
  addPerson(uid: string, person: Omit<Person, "id">) {
    return addItem(uid, PERSONS, person).then(() => undefined);
  }
  updatePerson(uid: string, id: string, patch: Partial<Omit<Person, "id">>) {
    return updateItem(uid, PERSONS, id, patch);
  }
  deletePerson(uid: string, id: string) {
    return deleteItem(uid, PERSONS, id);
  }

  listDebts(uid: string) {
    return listAll<Omit<Debt, "id">>(uid, DEBTS);
  }
  addDebt(uid: string, debt: Omit<Debt, "id">) {
    return addItem(uid, DEBTS, debt);
  }
  updateDebt(uid: string, id: string, patch: Partial<Omit<Debt, "id">>) {
    return updateItem(uid, DEBTS, id, patch);
  }
  deleteDebt(uid: string, id: string) {
    return deleteItem(uid, DEBTS, id);
  }

  listInstallments(uid: string) {
    return listAll<Omit<Installment, "id">>(uid, INSTALLMENTS);
  }
  addInstallment(uid: string, installment: Omit<Installment, "id">) {
    return addItem(uid, INSTALLMENTS, installment).then(() => undefined);
  }
  updateInstallment(uid: string, id: string, patch: Partial<Omit<Installment, "id">>) {
    return updateItem(uid, INSTALLMENTS, id, patch);
  }

  listLiquidBalances(uid: string) {
    return listAll<Omit<LiquidBalance, "id">>(uid, LIQUID);
  }
  addLiquidBalance(uid: string, balance: Omit<LiquidBalance, "id">) {
    return addItem(uid, LIQUID, balance).then(() => undefined);
  }
  updateLiquidBalance(uid: string, id: string, patch: Partial<Omit<LiquidBalance, "id">>) {
    return updateItem(uid, LIQUID, id, patch);
  }
  deleteLiquidBalance(uid: string, id: string) {
    return deleteItem(uid, LIQUID, id);
  }

  listSnapshots(uid: string) {
    return listAll<Omit<CuentasSnapshot, "id">>(uid, SNAPSHOTS);
  }
  addSnapshot(uid: string, snapshot: Omit<CuentasSnapshot, "id">) {
    return addItem(uid, SNAPSHOTS, snapshot).then(() => undefined);
  }
  deleteSnapshot(uid: string, id: string) {
    return deleteItem(uid, SNAPSHOTS, id);
  }
}
