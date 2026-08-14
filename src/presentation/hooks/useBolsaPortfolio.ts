import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBolsaPortfolio } from "@/application/use-cases/bolsa/getBolsaPortfolio";
import { FirestoreBolsaRepository } from "@/infrastructure/firebase/repositories/FirestoreBolsaRepository";
import { useAuth } from "@/presentation/providers/AuthProvider";
import type { StockHolding, StockPrice } from "@/domain/entities/bolsa";
import type { Movement } from "@/domain/entities/common";

const repo = new FirestoreBolsaRepository();
const QUERY_KEY = "bolsa-portfolio";

export function useBolsaPortfolio() {
  const { user } = useAuth();
  const uid = user?.uid as string;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY, uid],
    queryFn: () => getBolsaPortfolio(repo, uid),
    enabled: !!uid,
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: [QUERY_KEY, uid] });
  }

  const addHolding = useMutation({
    mutationFn: (holding: Omit<StockHolding, "id">) => repo.addHolding(uid, holding),
    onSuccess: invalidate,
  });

  const updateHolding = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<StockHolding, "id">> }) =>
      repo.updateHolding(uid, id, patch),
    onSuccess: invalidate,
  });

  const deleteHolding = useMutation({
    mutationFn: (id: string) => repo.deleteHolding(uid, id),
    onSuccess: invalidate,
  });

  const addMovement = useMutation({
    mutationFn: (movement: Omit<Movement, "id">) => repo.addMovement(uid, movement),
    onSuccess: invalidate,
  });

  const updateMovement = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<Movement, "id">> }) =>
      repo.updateMovement(uid, id, patch),
    onSuccess: invalidate,
  });

  const deleteMovement = useMutation({
    mutationFn: (id: string) => repo.deleteMovement(uid, id),
    onSuccess: invalidate,
  });

  const setPrice = useMutation({
    mutationFn: (price: StockPrice) => repo.setPrice(uid, price),
    onSuccess: invalidate,
  });

  return {
    query,
    addHolding,
    updateHolding,
    deleteHolding,
    addMovement,
    updateMovement,
    deleteMovement,
    setPrice,
  };
}
