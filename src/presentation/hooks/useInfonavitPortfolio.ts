import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FirestoreInfonavitRepository } from "@/infrastructure/firebase/repositories/FirestoreInfonavitRepository";
import { useAuth } from "@/presentation/providers/AuthProvider";
import type { InfonavitBalancePoint } from "@/domain/entities/infonavit";

const repo = new FirestoreInfonavitRepository();
const QUERY_KEY = "infonavit-balances";

export function useInfonavitPortfolio() {
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
    mutationFn: (point: Omit<InfonavitBalancePoint, "id">) => repo.addBalance(uid, point),
    onSuccess: invalidate,
  });

  const updateBalance = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<InfonavitBalancePoint, "id">> }) =>
      repo.updateBalance(uid, id, patch),
    onSuccess: invalidate,
  });

  const deleteBalance = useMutation({
    mutationFn: (id: string) => repo.deleteBalance(uid, id),
    onSuccess: invalidate,
  });

  const sorted = [...(query.data ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const latest = sorted[0];
  const previous = sorted[1];
  const first = sorted.at(-1);

  return { query, addBalance, updateBalance, deleteBalance, latest, previous, first };
}
