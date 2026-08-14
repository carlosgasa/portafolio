import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCuentasOverview } from "@/application/use-cases/cuentas/getCuentasOverview";
import {
  createInstallmentDebt,
  type CreateInstallmentDebtInput,
} from "@/application/use-cases/cuentas/createInstallmentDebt";
import { FirestoreCuentasRepository } from "@/infrastructure/firebase/repositories/FirestoreCuentasRepository";
import { useAuth } from "@/presentation/providers/AuthProvider";
import type {
  CardPayment,
  CreditCard,
  CuentasSnapshot,
  Debt,
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
  const deleteCardPayment = useMutation({
    mutationFn: (id: string) => repo.deleteCardPayment(uid, id),
    onSuccess: invalidate,
  });

  const addPerson = useMutation({
    mutationFn: (person: Omit<Person, "id">) => repo.addPerson(uid, person),
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
    mutationFn: (b: Omit<LiquidBalance, "id">) => repo.addLiquidBalance(uid, b),
    onSuccess: invalidate,
  });
  const updateLiquidBalance = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<LiquidBalance, "id">> }) =>
      repo.updateLiquidBalance(uid, id, patch),
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
    deleteCardPayment,
    addPerson,
    deletePerson,
    addSimpleDebt,
    addInstallmentDebt,
    toggleDebtPaid,
    deleteDebt,
    toggleInstallmentPaid,
    addLiquidBalance,
    updateLiquidBalance,
    deleteLiquidBalance,
    addSnapshot,
    deleteSnapshot,
  };
}
