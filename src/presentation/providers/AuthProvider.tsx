import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import {
  signInWithEmail,
  signOut,
  subscribeToAuthState,
} from "@/infrastructure/firebase/auth/authService";
import { ALLOWED_EMAIL } from "@/infrastructure/firebase/config";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAllowed: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const isAllowed = user?.email === ALLOWED_EMAIL;

  const value: AuthContextValue = {
    user,
    loading,
    isAllowed,
    signIn: async (email: string, password: string) => {
      await signInWithEmail(email, password);
    },
    signOutUser: signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
