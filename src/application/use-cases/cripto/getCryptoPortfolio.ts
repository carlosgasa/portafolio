import type { ICryptoRepository } from "@/domain/repositories/ICryptoRepository";
import type { CryptoHolding, CryptoPrice } from "@/domain/entities/cripto";
import type { Movement } from "@/domain/entities/common";

export interface CryptoHoldingWithValue extends CryptoHolding {
  precioMxn: number | null;
  valorActual: number | null;
  ganancia: number | null;
}

export interface CryptoPortfolio {
  holdings: CryptoHoldingWithValue[];
  movements: Movement[];
  valorTotal: number;
  aporteTotal: number;
  rendimiento: number;
}

export async function getCryptoPortfolio(
  repo: ICryptoRepository,
  uid: string,
): Promise<CryptoPortfolio> {
  const [holdings, movements, prices] = await Promise.all([
    repo.listHoldings(uid),
    repo.listMovements(uid),
    repo.listPrices(uid),
  ]);

  const priceBySymbol = new Map<string, CryptoPrice>(
    prices.map((p) => [p.symbol, p]),
  );

  const holdingsWithValue: CryptoHoldingWithValue[] = holdings.map((h) => {
    const price = priceBySymbol.get(h.symbol);
    const precioMxn = price?.precioMxn ?? null;
    const valorActual = precioMxn !== null ? h.cantidad * precioMxn : null;
    const ganancia = valorActual !== null ? valorActual - h.costoTotal : null;
    return { ...h, precioMxn, valorActual, ganancia };
  });

  const valorTotal = holdingsWithValue.reduce(
    (sum, h) => sum + (h.valorActual ?? 0),
    0,
  );
  const aporteTotal = movements.reduce((sum, m) => sum + m.monto, 0);
  const rendimiento = aporteTotal !== 0 ? (valorTotal - aporteTotal) / Math.abs(aporteTotal) : 0;

  return { holdings: holdingsWithValue, movements, valorTotal, aporteTotal, rendimiento };
}
