import type { IBolsaRepository } from "@/domain/repositories/IBolsaRepository";
import type { StockHolding, StockPrice } from "@/domain/entities/bolsa";
import type { Movement } from "@/domain/entities/common";

export interface StockHoldingWithValue extends StockHolding {
  precio: number | null;
  valorActual: number | null;
  ganancia: number | null;
}

export interface BolsaPortfolio {
  holdings: StockHoldingWithValue[];
  movements: Movement[];
  valorTotal: number;
  aporteTotal: number;
  rendimiento: number;
}

export async function getBolsaPortfolio(
  repo: IBolsaRepository,
  uid: string,
): Promise<BolsaPortfolio> {
  const [holdings, movements, prices] = await Promise.all([
    repo.listHoldings(uid),
    repo.listMovements(uid),
    repo.listPrices(uid),
  ]);

  const priceByTicker = new Map<string, StockPrice>(prices.map((p) => [p.ticker, p]));

  const holdingsWithValue: StockHoldingWithValue[] = holdings.map((h) => {
    const price = priceByTicker.get(h.ticker);
    const precio = price?.precio ?? null;
    const valorActual = precio !== null ? h.cantidad * precio : null;
    const ganancia = valorActual !== null ? valorActual - h.costoTotal : null;
    return { ...h, precio, valorActual, ganancia };
  });

  const valorTotal = holdingsWithValue.reduce((sum, h) => sum + (h.valorActual ?? 0), 0);
  const aporteTotal = movements.reduce((sum, m) => sum + m.monto, 0);
  const rendimiento = aporteTotal !== 0 ? (valorTotal - aporteTotal) / Math.abs(aporteTotal) : 0;

  return { holdings: holdingsWithValue, movements, valorTotal, aporteTotal, rendimiento };
}
