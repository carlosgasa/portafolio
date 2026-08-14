import { useState, type FormEvent } from "react";
import { Zap, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/presentation/providers/AuthProvider";

const ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/invalid-email": "Correo inválido.",
  "auth/too-many-requests": "Demasiados intentos. Espera un momento.",
};

export function LoginPage() {
  const { user, isAllowed, signIn, signOutUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showUnauthorized = user && !isAllowed;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setError(ERROR_MESSAGES[code] ?? "No se pudo iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <div className="flex items-center gap-2">
        <Zap className="size-8 text-primary" />
        <h1 className="text-2xl font-semibold">Portafolio</h1>
      </div>

      {showUnauthorized ? (
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center">
          <ShieldAlert className="size-8 text-destructive" />
          <p className="text-sm text-foreground">
            Esta app es de uso privado. La cuenta <strong>{user.email}</strong> no
            tiene acceso.
          </p>
          <Button variant="secondary" onClick={() => signOutUser()}>
            Cerrar sesión
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-xs flex-col gap-4 rounded-lg border border-border bg-card/60 p-6"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-negative">{error}</p>}
          <Button type="submit" className="glow-primary" disabled={submitting}>
            {submitting ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      )}
    </div>
  );
}
