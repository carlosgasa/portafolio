import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FirestoreAforeRepository } from "@/infrastructure/firebase/repositories/FirestoreAforeRepository";
import { useAuth } from "@/presentation/providers/AuthProvider";
import type { AforeBalancePoint } from "@/domain/entities/afore";

const repo = new FirestoreAforeRepository();
const QUERY_KEY = "afore-balances";

export function useAforePortfolio() {
  const { user } = useAuth();
  const uid = user?.uid as string;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY, uid],
    queryFn: () => repo.listBalances(uid),
    enabled: !!uid,
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: [QUERY_KEY, uid] });
  }

  const addBalance = useMutation({
    mutationFn: (point: Omit<AforeBalancePoint, "id">) => repo.addBalance(uid, point),
    onSuccess: invalidate,
  });

  const deleteBalance = useMutation({
    mutationFn: (id: string) => repo.deleteBalance(uid, id),
    onSuccess: invalidate,
  });

  const latest = [...(query.data ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];

  return { query, addBalance, deleteBalance, latest };
}
