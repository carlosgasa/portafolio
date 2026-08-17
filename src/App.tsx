import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/presentation/components/layout/AppLayout";
import { ProtectedRoute } from "@/presentation/components/ProtectedRoute";
import { useStartPage } from "@/presentation/hooks/useStartPage";

const DashboardPage = lazy(() =>
  import("@/presentation/pages/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const CriptoPage = lazy(() =>
  import("@/presentation/pages/CriptoPage").then((m) => ({
    default: m.CriptoPage,
  })),
);
const BolsaPage = lazy(() =>
  import("@/presentation/pages/BolsaPage").then((m) => ({
    default: m.BolsaPage,
  })),
);
const FinsusPage = lazy(() =>
  import("@/presentation/pages/FinsusPage").then((m) => ({
    default: m.FinsusPage,
  })),
);
const YoTePrestoPage = lazy(() =>
  import("@/presentation/pages/YoTePrestoPage").then((m) => ({
    default: m.YoTePrestoPage,
  })),
);
const AforePage = lazy(() =>
  import("@/presentation/pages/AforePage").then((m) => ({
    default: m.AforePage,
  })),
);
const CasaPage = lazy(() =>
  import("@/presentation/pages/CasaPage").then((m) => ({
    default: m.CasaPage,
  })),
);
const CuentasPage = lazy(() =>
  import("@/presentation/pages/CuentasPage").then((m) => ({
    default: m.CuentasPage,
  })),
);

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
      Cargando…
    </div>
  );
}

/** "/" abre el Dashboard por default, o la pantalla que se haya elegido en
 * Configuracion. */
function IndexRoute() {
  const { page } = useStartPage();
  if (page !== "/") return <Navigate to={page} replace />;
  return <DashboardPage />;
}

function App() {
  return (
    <BrowserRouter>
      <ProtectedRoute>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<IndexRoute />} />
              <Route path="cripto" element={<CriptoPage />} />
              <Route path="bolsa" element={<BolsaPage />} />
              <Route path="finsus" element={<FinsusPage />} />
              <Route path="yotepresto" element={<YoTePrestoPage />} />
              <Route path="afore" element={<AforePage />} />
              <Route path="casa" element={<CasaPage />} />
              <Route path="cuentas" element={<CuentasPage />} />
            </Route>
          </Routes>
        </Suspense>
      </ProtectedRoute>
    </BrowserRouter>
  );
}

export default App;
