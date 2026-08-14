import type { ReactNode } from "react";
import { useAuth } from "@/presentation/providers/AuthProvider";
import { LoginPage } from "@/presentation/pages/LoginPage";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, isAllowed } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Cargando…
      </div>
    );
  }

  if (!user || !isAllowed) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
