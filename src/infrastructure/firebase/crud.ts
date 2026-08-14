import {
  addDoc,
  deleteDoc as firestoreDeleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc as firestoreUpdateDoc,
  type DocumentData,
} from "firebase/firestore";
import { userCollection } from "@/infrastructure/firebase/userCollection";

/** Helpers genericos de CRUD para colecciones bajo users/{uid}/{name}. */

export async function listAll<T>(uid: string, name: string): Promise<(T & { id: string })[]> {
  const snap = await getDocs(userCollection(uid, name));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
}

export async function addItem<T extends DocumentData>(
  uid: string,
  name: string,
  data: T,
): Promise<string> {
  const ref = await addDoc(userCollection(uid, name), data);
  return ref.id;
}

export async function updateItem(
  uid: string,
  name: string,
  id: string,
  patch: Partial<DocumentData>,
): Promise<void> {
  await firestoreUpdateDoc(doc(userCollection(uid, name), id), patch);
}

export async function deleteItem(uid: string, name: string, id: string): Promise<void> {
  await firestoreDeleteDoc(doc(userCollection(uid, name), id));
}

export async function setItem(
  uid: string,
  name: string,
  id: string,
  data: DocumentData,
): Promise<void> {
  await setDoc(doc(userCollection(uid, name), id), data);
}
