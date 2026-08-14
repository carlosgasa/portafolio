import { getDocs, orderBy, query } from "firebase/firestore";
import type { ISnapshotRepository } from "@/domain/repositories/ISnapshotRepository";
import type { PortfolioSnapshot } from "@/domain/entities/dashboard";
import { userCollection } from "@/infrastructure/firebase/userCollection";

export class FirestoreSnapshotRepository implements ISnapshotRepository {
  async listSnapshots(uid: string): Promise<PortfolioSnapshot[]> {
    const q = query(userCollection(uid, "snapshots"), orderBy("fecha", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PortfolioSnapshot);
  }
}
