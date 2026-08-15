import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useZoomLevel } from "@/presentation/hooks/useZoomLevel";

/** Zoom de toda la app (CSS zoom sobre <html>), persistido en localStorage.
 * Como PWA instalada (display: standalone) el pinch-to-zoom nativo no
 * funciona en la mayoria de plataformas aunque el viewport lo permita, asi
 * que esto es la unica forma de ver la app mas compacta/grande. */
export function ZoomControl() {
  const { level, zoomIn, zoomOut, reset, canZoomIn, canZoomOut, isDefault } = useZoomLevel();

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Alejar"
        title="Alejar"
        disabled={!canZoomOut}
        onClick={zoomOut}
      >
        <ZoomOut className="size-4" />
      </Button>
      <button
        type="button"
        aria-label="Restablecer zoom"
        title="Restablecer zoom"
        disabled={isDefault}
        onClick={reset}
        className="min-w-9 px-1 text-center text-xs tabular-nums text-muted-foreground hover:text-foreground disabled:hover:text-muted-foreground"
      >
        {level}%
      </button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Acercar"
        title="Acercar"
        disabled={!canZoomIn}
        onClick={zoomIn}
      >
        <ZoomIn className="size-4" />
      </Button>
    </div>
  );
}
