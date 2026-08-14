import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/presentation/components/layout/AppLayout";
import { ProtectedRoute } from "@/presentation/components/ProtectedRoute";

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

function App() {
  return (
    <BrowserRouter>
      <ProtectedRoute>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
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
