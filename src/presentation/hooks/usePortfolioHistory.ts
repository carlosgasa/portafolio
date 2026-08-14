import { useQuery } from "@tanstack/react-query";
import { getPortfolioHistory } from "@/application/use-cases/dashboard/getPortfolioHistory";
import { FirestoreSnapshotRepository } from "@/infrastructure/firebase/repositories/FirestoreSnapshotRepository";
import { useAuth } from "@/presentation/providers/AuthProvider";

const repo = new FirestoreSnapshotRepository();

export function usePortfolioHistory() {
  const { user } = useAuth();
  const uid = user?.uid;

  return useQuery({
    queryKey: ["portfolio-history", uid],
    queryFn: () => getPortfolioHistory(repo, uid as string),
    enabled: !!uid,
  });
}
