import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

const RELOAD_FLAG = "portafolio:chunk-reload";

/** Si un deploy nuevo cambia los nombres de los chunks mientras alguien ya
 * tiene la app abierta (shell viejo cacheado por el service worker), el
 * lazy import de una ruta falla al pedir un archivo que ya no existe.
 * Suspense no atrapa errores, solo estados de carga, asi que sin este
 * boundary React desmonta todo y queda en blanco. Aqui detectamos ese caso
 * puntual y recargamos una sola vez (el reload trae el index.html nuevo con
 * las referencias correctas); para cualquier otro error mostramos un
 * mensaje con boton de recargar en vez de dejar la pantalla en blanco. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const isChunkLoadError =
      /dynamically imported module|failed to fetch|loading chunk|importing a module script failed/i.test(
        message,
      );
    if (isChunkLoadError && !sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, "1");
      window.location.reload();
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-muted-foreground">
        <p className="text-sm">
          Hubo un problema cargando la app (probablemente salió una versión nueva).
        </p>
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          onClick={() => {
            sessionStorage.removeItem(RELOAD_FLAG);
            window.location.reload();
          }}
        >
          Recargar
        </button>
      </div>
    );
  }
}
