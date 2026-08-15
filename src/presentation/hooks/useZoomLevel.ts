import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "portafolio.zoom";
const MIN = 70;
const MAX = 150;
const STEP = 10;
const DEFAULT = 100;

function readInitial(): number {
  if (typeof localStorage === "undefined") return DEFAULT;
  const stored = Number(localStorage.getItem(STORAGE_KEY));
  return stored >= MIN && stored <= MAX ? stored : DEFAULT;
}

let zoom = readInitial();
const listeners = new Set<() => void>();

function applyZoom(value: number) {
  if (typeof document === "undefined") return;
  document.documentElement.style.zoom = `${value}%`;
}
applyZoom(zoom);

function setZoom(value: number) {
  zoom = Math.min(MAX, Math.max(MIN, value));
  localStorage.setItem(STORAGE_KEY, String(zoom));
  applyZoom(zoom);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return zoom;
}

/** Nivel de zoom global (localStorage), aplicado al documento entero via
 * CSS zoom. Util sobre todo como PWA instalada: en modo standalone el
 * pinch-to-zoom nativo no funciona en la mayoria de plataformas, aunque el
 * viewport lo permita. Store compartido (no useState) por la misma razon
 * que useHiddenBalances: que el control se refleje en toda la app al
 * instante, sin recargar. */
export function useZoomLevel() {
  const level = useSyncExternalStore(subscribe, getSnapshot);
  const zoomIn = useCallback(() => setZoom(zoom + STEP), []);
  const zoomOut = useCallback(() => setZoom(zoom - STEP), []);
  const reset = useCallback(() => setZoom(DEFAULT), []);
  return {
    level,
    zoomIn,
    zoomOut,
    reset,
    canZoomIn: level < MAX,
    canZoomOut: level > MIN,
    isDefault: level === DEFAULT,
  };
}
