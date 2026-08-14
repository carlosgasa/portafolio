import type { StockHolding, StockPrice } from "@/domain/entities/bolsa";
import type { Movement } from "@/domain/entities/common";

export interface IBolsaRepository {
  listHoldings(uid: string): Promise<StockHolding[]>;
  addHolding(uid: string, holding: Omit<StockHolding, "id">): Promise<void>;
  updateHolding(
    uid: string,
    id: string,
    patch: Partial<Omit<StockHolding, "id">>,
  ): Promise<void>;
  deleteHolding(uid: string, id: string): Promise<void>;

  listMovements(uid: string): Promise<Movement[]>;
  addMovement(uid: string, movement: Omit<Movement, "id">): Promise<void>;
  updateMovement(uid: string, id: string, patch: Partial<Omit<Movement, "id">>): Promise<void>;
  deleteMovement(uid: string, id: string): Promise<void>;

  listPrices(uid: string): Promise<StockPrice[]>;
  setPrice(uid: string, price: StockPrice): Promise<void>;
}
