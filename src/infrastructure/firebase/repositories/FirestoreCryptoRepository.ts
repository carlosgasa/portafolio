import type { ICryptoRepository } from "@/domain/repositories/ICryptoRepository";
import type { CryptoHolding, CryptoPrice } from "@/domain/entities/cripto";
import type { Movement } from "@/domain/entities/common";
import { addItem, deleteItem, listAll, setItem, updateItem } from "@/infrastructure/firebase/crud";

const HOLDINGS = "criptoHoldings";
const MOVEMENTS = "criptoMovimientos";
const PRICES = "criptoPrecios";

export class FirestoreCryptoRepository implements ICryptoRepository {
  listHoldings(uid: string) {
    return listAll<Omit<CryptoHolding, "id">>(uid, HOLDINGS);
  }

  addHolding(uid: string, holding: Omit<CryptoHolding, "id">) {
    return addItem(uid, HOLDINGS, holding).then(() => undefined);
  }

  updateHolding(uid: string, id: string, patch: Partial<Omit<CryptoHolding, "id">>) {
    return updateItem(uid, HOLDINGS, id, patch);
  }

  deleteHolding(uid: string, id: string) {
    return deleteItem(uid, HOLDINGS, id);
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

  listPrices(uid: string) {
    return listAll<CryptoPrice>(uid, PRICES);
  }

  setPrice(uid: string, price: CryptoPrice) {
    return setItem(uid, PRICES, price.symbol, price);
  }
}
