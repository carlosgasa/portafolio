import type { IYoTePrestoRepository } from "@/domain/repositories/IYoTePrestoRepository";
import type { AccountValuePoint } from "@/domain/entities/yotepresto";
import type { Movement } from "@/domain/entities/common";

export interface YoTePrestoPortfolio {
  values: AccountValuePoint[];
  movements: Movement[];
  valorTotal: number;
  aporteTotal: number;
  rendimiento: number;
}

export async function getYoTePrestoPortfolio(
  repo: IYoTePrestoRepository,
  uid: string,
): Promise<YoTePrestoPortfolio> {
  const [values, movements] = await Promise.all([
    repo.listValues(uid),
    repo.listMovements(uid),
  ]);

  const latest = [...values].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  const valorTotal = latest?.valorCuenta ?? 0;
  const aporteTotal = movements.reduce((sum, m) => sum + m.monto, 0);
  const rendimiento = aporteTotal !== 0 ? (valorTotal - aporteTotal) / Math.abs(aporteTotal) : 0;

  return { values, movements, valorTotal, aporteTotal, rendimiento };
}
