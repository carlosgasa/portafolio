import type { IBolsaRepository } from "@/domain/repositories/IBolsaRepository";
import type { StockHolding, StockPrice } from "@/domain/entities/bolsa";
import type { Movement } from "@/domain/entities/common";
import { addItem, deleteItem, listAll, setItem, updateItem } from "@/infrastructure/firebase/crud";

const HOLDINGS = "bolsaHoldings";
const MOVEMENTS = "bolsaMovimientos";
const PRICES = "bolsaPrecios";

export class FirestoreBolsaRepository implements IBolsaRepository {
  listHoldings(uid: string) {
    return listAll<Omit<StockHolding, "id">>(uid, HOLDINGS);
  }

  addHolding(uid: string, holding: Omit<StockHolding, "id">) {
    return addItem(uid, HOLDINGS, holding).then(() => undefined);
  }

  updateHolding(uid: string, id: string, patch: Partial<Omit<StockHolding, "id">>) {
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
    return listAll<StockPrice>(uid, PRICES);
  }

  setPrice(uid: string, price: StockPrice) {
    return setItem(uid, PRICES, price.ticker, price);
  }
}
