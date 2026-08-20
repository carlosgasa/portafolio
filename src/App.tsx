import { lazy, Suspense, useState } from "react";
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
const InfonavitPage = lazy(() =>
  import("@/presentation/pages/InfonavitPage").then((m) => ({
    default: m.InfonavitPage,
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

const START_PAGE_REDIRECT_FLAG = "portafolio:start-page-redirected";

/** "/" abre el Dashboard por default, o la pantalla que se haya elegido en
 * Configuracion — pero solo la primera vez que se entra en esta sesion. Si
 * redirigiera SIEMPRE que se visita "/", el propio link de "Dashboard" del
 * menu (que apunta a "/") quedaria inalcanzable en cuanto se elige otra
 * pantalla de inicio: cada clic ahi rebotaria de vuelta a esa pantalla. */
function IndexRoute() {
  const { page } = useStartPage();
  const [alreadyRedirected] = useState(() => {
    if (page === "/") return true;
    if (sessionStorage.getItem(START_PAGE_REDIRECT_FLAG)) return true;
    sessionStorage.setItem(START_PAGE_REDIRECT_FLAG, "1");
    return false;
  });

  if (!alreadyRedirected && page !== "/") return <Navigate to={page} replace />;
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
              <Route path="infonavit" element={<InfonavitPage />} />
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
