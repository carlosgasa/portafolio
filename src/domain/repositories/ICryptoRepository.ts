import type { CryptoHolding, CryptoPrice } from "@/domain/entities/cripto";
import type { Movement } from "@/domain/entities/common";

export interface ICryptoRepository {
  listHoldings(uid: string): Promise<CryptoHolding[]>;
  addHolding(uid: string, holding: Omit<CryptoHolding, "id">): Promise<void>;
  updateHolding(
    uid: string,
    id: string,
    patch: Partial<Omit<CryptoHolding, "id">>,
  ): Promise<void>;
  deleteHolding(uid: string, id: string): Promise<void>;

  listMovements(uid: string): Promise<Movement[]>;
  addMovement(uid: string, movement: Omit<Movement, "id">): Promise<void>;
  deleteMovement(uid: string, id: string): Promise<void>;

  listPrices(uid: string): Promise<CryptoPrice[]>;
  setPrice(uid: string, price: CryptoPrice): Promise<void>;
}
