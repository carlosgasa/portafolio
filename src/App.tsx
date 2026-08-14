import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/presentation/components/layout/AppLayout";
import { ProtectedRoute } from "@/presentation/components/ProtectedRoute";
import { ComingSoonPage } from "@/presentation/pages/ComingSoonPage";

const DashboardPage = lazy(() =>
  import("@/presentation/pages/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
      Cargando…
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ProtectedRoute>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="cripto" element={<ComingSoonPage title="Cripto" />} />
              <Route path="bolsa" element={<ComingSoonPage title="Bolsa" />} />
              <Route path="finsus" element={<ComingSoonPage title="Finsus" />} />
              <Route
                path="yotepresto"
                element={<ComingSoonPage title="YoTePresto" />}
              />
              <Route path="afore" element={<ComingSoonPage title="AFORE" />} />
              <Route path="casa" element={<ComingSoonPage title="Casa" />} />
              <Route
                path="cuentas"
                element={<ComingSoonPage title="Cuentas" />}
              />
            </Route>
          </Routes>
        </Suspense>
      </ProtectedRoute>
    </BrowserRouter>
  );
}

export default App;
