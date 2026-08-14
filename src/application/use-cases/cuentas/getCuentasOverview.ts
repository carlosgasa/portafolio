import type { ICuentasRepository } from "@/domain/repositories/ICuentasRepository";
import type {
  CardPayment,
  CreditCard,
  Debt,
  Installment,
  LiquidBalance,
  Person,
} from "@/domain/entities/cuentas";

export interface CardWithPayments extends CreditCard {
  pagos: CardPayment[];
  pendiente: number;
}

export interface DebtWithInstallments extends Debt {
  cuotas: Installment[];
  saldoPendiente: number;
}

export interface PersonWithDebts extends Person {
  deudas: DebtWithInstallments[];
  totalMeDebe: number;
}

export interface CuentasOverview {
  cards: CardWithPayments[];
  persons: PersonWithDebts[];
  liquidBalances: LiquidBalance[];
  totalTarjetasPendiente: number;
  totalMeDeben: number;
  totalLiquidez: number;
}

export async function getCuentasOverview(
  repo: ICuentasRepository,
  uid: string,
): Promise<CuentasOverview> {
  const [cards, cardPayments, persons, debts, installments, liquidBalances] =
    await Promise.all([
      repo.listCards(uid),
      repo.listCardPayments(uid),
      repo.listPersons(uid),
      repo.listDebts(uid),
      repo.listInstallments(uid),
      repo.listLiquidBalances(uid),
    ]);

  const cardsWithPayments: CardWithPayments[] = cards.map((c) => {
    const pagos = cardPayments.filter((p) => p.tarjetaId === c.id);
    const pendiente = pagos.filter((p) => !p.pagado).reduce((s, p) => s + p.monto, 0);
    return { ...c, pagos, pendiente };
  });

  const debtsWithInstallments: DebtWithInstallments[] = debts.map((d) => {
    const cuotas = installments.filter((i) => i.deudaId === d.id);
    const saldoPendiente =
      d.tipo === "cuotas"
        ? cuotas.filter((c) => !c.pagada).reduce((s, c) => s + c.monto, 0)
        : d.pagada
          ? 0
          : d.montoTotal;
    return { ...d, cuotas, saldoPendiente };
  });

  const personsWithDebts: PersonWithDebts[] = persons.map((p) => {
    const deudas = debtsWithInstallments.filter((d) => d.personaId === p.id);
    const totalMeDebe = deudas.reduce((s, d) => s + d.saldoPendiente, 0);
    return { ...p, deudas, totalMeDebe };
  });

  return {
    cards: cardsWithPayments,
    persons: personsWithDebts,
    liquidBalances,
    totalTarjetasPendiente: cardsWithPayments.reduce((s, c) => s + c.pendiente, 0),
    totalMeDeben: personsWithDebts.reduce((s, p) => s + p.totalMeDebe, 0),
    totalLiquidez: liquidBalances.reduce((s, b) => s + b.monto, 0),
  };
}
