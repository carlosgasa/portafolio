import type { IFinsusRepository } from "@/domain/repositories/IFinsusRepository";
import type { FixedTermAccount } from "@/domain/entities/finsus";
import type { Movement } from "@/domain/entities/common";

export interface FinsusPortfolio {
  accounts: FixedTermAccount[];
  movements: Movement[];
  valorTotal: number;
  aporteTotal: number;
  rendimiento: number;
}

export async function getFinsusPortfolio(
  repo: IFinsusRepository,
  uid: string,
): Promise<FinsusPortfolio> {
  const [accounts, movements] = await Promise.all([
    repo.listAccounts(uid),
    repo.listMovements(uid),
  ]);

  const valorTotal = accounts
    .filter((a) => !a.vencida)
    .reduce((sum, a) => sum + a.saldo, 0);
  const aporteTotal = movements.reduce((sum, m) => sum + m.monto, 0);
  const rendimiento = aporteTotal !== 0 ? (valorTotal - aporteTotal) / Math.abs(aporteTotal) : 0;

  return { accounts, movements, valorTotal, aporteTotal, rendimiento };
}
