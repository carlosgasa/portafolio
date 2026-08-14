import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FirestoreCasaRepository } from "@/infrastructure/firebase/repositories/FirestoreCasaRepository";
import { useAuth } from "@/presentation/providers/AuthProvider";
import type { ExpenseItem } from "@/domain/entities/casa";

const repo = new FirestoreCasaRepository();
const QUERY_KEY = "casa-gastos";

export function useCasaExpenses() {
  const { user } = useAuth();
  const uid = user?.uid as string;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY, uid],
    queryFn: () => repo.listExpenses(uid),
    enabled: !!uid,
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: [QUERY_KEY, uid] });
  }

  const addExpense = useMutation({
    mutationFn: (item: Omit<ExpenseItem, "id">) => repo.addExpense(uid, item),
    onSuccess: invalidate,
  });

  const updateExpense = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<ExpenseItem, "id">> }) =>
      repo.updateExpense(uid, id, patch),
    onSuccess: invalidate,
  });

  const deleteExpense = useMutation({
    mutationFn: (id: string) => repo.deleteExpense(uid, id),
    onSuccess: invalidate,
  });

  const total = (query.data ?? []).reduce((sum, e) => sum + e.total, 0);

  return { query, addExpense, updateExpense, deleteExpense, total };
}
