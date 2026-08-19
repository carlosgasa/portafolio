import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCuentasOverview } from "@/application/use-cases/cuentas/getCuentasOverview";
import {
  createInstallmentDebt,
  type CreateInstallmentDebtInput,
} from "@/application/use-cases/cuentas/createInstallmentDebt";
import { FirestoreCuentasRepository } from "@/infrastructure/firebase/repositories/FirestoreCuentasRepository";
import { useAuth } from "@/presentation/providers/AuthProvider";
import { addMonths } from "@/shared/utils/dates";
import type {
  CardPayment,
  CreditCard,
  CuentasSnapshot,
  Debt,
  Installment,
  LiquidBalance,
  Person,
} from "@/domain/entities/cuentas";

const repo = new FirestoreCuentasRepository();
const QUERY_KEY = "cuentas-overview";

export function useCuentas() {
  const { user } = useAuth();
  const uid = user?.uid as string;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY, uid],
    queryFn: () => getCuentasOverview(repo, uid),
    enabled: !!uid,
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: [QUERY_KEY, uid] });
  }

  const addCard = useMutation({
    mutationFn: (card: Omit<CreditCard, "id">) => repo.addCard(uid, card),
    onSuccess: invalidate,
  });
  const updateCard = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<CreditCard, "id">> }) =>
      repo.updateCard(uid, id, patch),
    onSuccess: invalidate,
  });
  const deleteCard = useMutation({
    mutationFn: (id: string) => repo.deleteCard(uid, id),
    onSuccess: invalidate,
  });

  const addCardPayment = useMutation({
    mutationFn: (payment: Omit<CardPayment, "id">) => repo.addCardPayment(uid, payment),
    onSuccess: invalidate,
  });
  const toggleCardPayment = useMutation({
    mutationFn: ({ id, pagado }: { id: string; pagado: boolean }) =>
      repo.updateCardPayment(uid, id, { pagado }),
    onSuccess: invalidate,
  });
  const updateCardPayment = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<CardPayment, "id">> }) =>
      repo.updateCardPayment(uid, id, patch),
    onSuccess: invalidate,
  });
  const deleteCardPayment = useMutation({
    mutationFn: (id: string) => repo.deleteCardPayment(uid, id),
    onSuccess: invalidate,
  });

  const addPerson = useMutation({
    mutationFn: (person: Omit<Person, "id">) => repo.addPerson(uid, person),
    onSuccess: invalidate,
  });
  const updatePerson = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<Person, "id">> }) =>
      repo.updatePerson(uid, id, patch),
    onSuccess: invalidate,
  });
  const deletePerson = useMutation({
    mutationFn: (id: string) => repo.deletePerson(uid, id),
    onSuccess: invalidate,
  });

  const addSimpleDebt = useMutation({
    mutationFn: (debt: Omit<Debt, "id">) => repo.addDebt(uid, debt),
    onSuccess: invalidate,
  });
  const addInstallmentDebt = useMutation({
    mutationFn: (input: CreateInstallmentDebtInput) => createInstallmentDebt(repo, uid, input),
    onSuccess: invalidate,
  });
  const toggleDebtPaid = useMutation({
    mutationFn: ({ id, pagada }: { id: string; pagada: boolean }) =>
      repo.updateDebt(uid, id, { pagada }),
    onSuccess: invalidate,
  });
  const updateDebt = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<Debt, "id">> }) =>
      repo.updateDebt(uid, id, patch),
    onSuccess: invalidate,
  });
  const updateInstallmentDates = useMutation({
    mutationFn: async ({
      debtId,
      cuotas,
      fechaInicial,
    }: {
      debtId: string;
      cuotas: Installment[];
      fechaInicial: string;
    }) => {
      await repo.updateDebt(uid, debtId, { fechaCreacion: fechaInicial });
      await Promise.all(
        cuotas.map((c) =>
          repo.updateInstallment(uid, c.id, { fecha: addMonths(fechaInicial, c.numero - 1) }),
        ),
      );
    },
    onSuccess: invalidate,
  });
  const deleteDebt = useMutation({
    mutationFn: (id: string) => repo.deleteDebt(uid, id),
    onSuccess: invalidate,
  });

  const toggleInstallmentPaid = useMutation({
    mutationFn: ({ id, pagada }: { id: string; pagada: boolean }) =>
      repo.updateInstallment(uid, id, { pagada }),
    onSuccess: invalidate,
  });

  const addLiquidBalance = useMutation({
    mutationFn: async (b: Omit<LiquidBalance, "id">) => {
      const id = await repo.addLiquidBalance(uid, b);
      await repo.addLiquidBalanceHistoryEntry(uid, {
        balanceId: id,
        fecha: new Date().toISOString().slice(0, 10),
        monto: b.monto,
      });
    },
    onSuccess: invalidate,
  });
  const updateLiquidBalance = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Omit<LiquidBalance, "id">> }) => {
      await repo.updateLiquidBalance(uid, id, patch);
      if (patch.monto !== undefined) {
        await repo.addLiquidBalanceHistoryEntry(uid, {
          balanceId: id,
          fecha: new Date().toISOString().slice(0, 10),
          monto: patch.monto,
        });
      }
    },
    onSuccess: invalidate,
  });
  const deleteLiquidBalance = useMutation({
    mutationFn: (id: string) => repo.deleteLiquidBalance(uid, id),
    onSuccess: invalidate,
  });

  const addSnapshot = useMutation({
    mutationFn: (snapshot: Omit<CuentasSnapshot, "id">) => repo.addSnapshot(uid, snapshot),
    onSuccess: invalidate,
  });
  const deleteSnapshot = useMutation({
    mutationFn: (id: string) => repo.deleteSnapshot(uid, id),
    onSuccess: invalidate,
  });

  return {
    query,
    addCard,
    updateCard,
    deleteCard,
    addCardPayment,
    toggleCardPayment,
    updateCardPayment,
    deleteCardPayment,
    addPerson,
    updatePerson,
    deletePerson,
    addSimpleDebt,
    addInstallmentDebt,
    toggleDebtPaid,
    updateDebt,
    updateInstallmentDates,
    deleteDebt,
    toggleInstallmentPaid,
    addLiquidBalance,
    updateLiquidBalance,
    deleteLiquidBalance,
    addSnapshot,
    deleteSnapshot,
  };
}
