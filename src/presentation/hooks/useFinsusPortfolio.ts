import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFinsusPortfolio } from "@/application/use-cases/finsus/getFinsusPortfolio";
import { FirestoreFinsusRepository } from "@/infrastructure/firebase/repositories/FirestoreFinsusRepository";
import { useAuth } from "@/presentation/providers/AuthProvider";
import type { FixedTermAccount } from "@/domain/entities/finsus";
import type { Movement } from "@/domain/entities/common";

const repo = new FirestoreFinsusRepository();
const QUERY_KEY = "finsus-portfolio";

export function useFinsusPortfolio() {
  const { user } = useAuth();
  const uid = user?.uid as string;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY, uid],
    queryFn: () => getFinsusPortfolio(repo, uid),
    enabled: !!uid,
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: [QUERY_KEY, uid] });
  }

  const addAccount = useMutation({
    mutationFn: (account: Omit<FixedTermAccount, "id">) => repo.addAccount(uid, account),
    onSuccess: invalidate,
  });

  const updateAccount = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<FixedTermAccount, "id">> }) =>
      repo.updateAccount(uid, id, patch),
    onSuccess: invalidate,
  });

  const deleteAccount = useMutation({
    mutationFn: (id: string) => repo.deleteAccount(uid, id),
    onSuccess: invalidate,
  });

  const addMovement = useMutation({
    mutationFn: (movement: Omit<Movement, "id">) => repo.addMovement(uid, movement),
    onSuccess: invalidate,
  });

  const deleteMovement = useMutation({
    mutationFn: (id: string) => repo.deleteMovement(uid, id),
    onSuccess: invalidate,
  });

  return { query, addAccount, updateAccount, deleteAccount, addMovement, deleteMovement };
}
