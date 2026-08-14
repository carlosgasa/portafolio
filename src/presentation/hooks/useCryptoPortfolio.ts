import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCryptoPortfolio } from "@/application/use-cases/cripto/getCryptoPortfolio";
import { FirestoreCryptoRepository } from "@/infrastructure/firebase/repositories/FirestoreCryptoRepository";
import { useAuth } from "@/presentation/providers/AuthProvider";
import type { CryptoHolding, CryptoPrice } from "@/domain/entities/cripto";
import type { Movement } from "@/domain/entities/common";

const repo = new FirestoreCryptoRepository();
const QUERY_KEY = "cripto-portfolio";

export function useCryptoPortfolio() {
  const { user } = useAuth();
  const uid = user?.uid as string;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY, uid],
    queryFn: () => getCryptoPortfolio(repo, uid),
    enabled: !!uid,
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: [QUERY_KEY, uid] });
  }

  const addHolding = useMutation({
    mutationFn: (holding: Omit<CryptoHolding, "id">) => repo.addHolding(uid, holding),
    onSuccess: invalidate,
  });

  const updateHolding = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<CryptoHolding, "id">> }) =>
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

  const deleteMovement = useMutation({
    mutationFn: (id: string) => repo.deleteMovement(uid, id),
    onSuccess: invalidate,
  });

  const setPrice = useMutation({
    mutationFn: (price: CryptoPrice) => repo.setPrice(uid, price),
    onSuccess: invalidate,
  });

  return {
    query,
    addHolding,
    updateHolding,
    deleteHolding,
    addMovement,
    deleteMovement,
    setPrice,
  };
}
