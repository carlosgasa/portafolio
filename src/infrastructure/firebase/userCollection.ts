import { collection, type CollectionReference, type DocumentData } from "firebase/firestore";
import { db } from "@/infrastructure/firebase/config";

/** Todas las colecciones de datos viven bajo users/{uid}/{name}. */
export function userCollection(
  uid: string,
  name: string,
): CollectionReference<DocumentData> {
  return collection(db, "users", uid, name);
}
