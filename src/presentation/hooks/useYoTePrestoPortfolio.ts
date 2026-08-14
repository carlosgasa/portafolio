import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getYoTePrestoPortfolio } from "@/application/use-cases/yotepresto/getYoTePrestoPortfolio";
import { FirestoreYoTePrestoRepository } from "@/infrastructure/firebase/repositories/FirestoreYoTePrestoRepository";
import { useAuth } from "@/presentation/providers/AuthProvider";
import type { AccountValuePoint } from "@/domain/entities/yotepresto";
import type { Movement } from "@/domain/entities/common";

const repo = new FirestoreYoTePrestoRepository();
const QUERY_KEY = "yotepresto-portfolio";

export function useYoTePrestoPortfolio() {
  const { user } = useAuth();
  const uid = user?.uid as string;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY, uid],
    queryFn: () => getYoTePrestoPortfolio(repo, uid),
    enabled: !!uid,
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: [QUERY_KEY, uid] });
  }

  const addValue = useMutation({
    mutationFn: (point: Omit<AccountValuePoint, "id">) => repo.addValue(uid, point),
    onSuccess: invalidate,
  });

  const deleteValue = useMutation({
    mutationFn: (id: string) => repo.deleteValue(uid, id),
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

  return { query, addValue, deleteValue, addMovement, deleteMovement };
}
