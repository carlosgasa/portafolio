import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { toast } from "sonner";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "@/presentation/providers/AuthProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/presentation/components/ErrorBoundary";

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: () => toast.error("No se pudo guardar. Revisa tu conexión e intenta de nuevo."),
  }),
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
            <Toaster richColors />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
