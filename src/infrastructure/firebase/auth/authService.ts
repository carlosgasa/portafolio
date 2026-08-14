import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "@/infrastructure/firebase/config";

export function signInWithEmail(email: string, password: string): Promise<User> {
  return signInWithEmailAndPassword(auth, email, password).then(
    (cred) => cred.user,
  );
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

export function subscribeToAuthState(
  callback: (user: User | null) => void,
): () => void {
  return onAuthStateChanged(auth, callback);
}
