import { useCallback, useSyncExternalStore } from "react";
import { navItems } from "@/presentation/components/layout/nav-items";

const STORAGE_KEY = "portafolio.start-page";
const DEFAULT = "/";

function isValidRoute(value: string | null): value is string {
  return value !== null && navItems.some((item) => item.to === value);
}

function readInitial(): string {
  if (typeof localStorage === "undefined") return DEFAULT;
  const stored = localStorage.getItem(STORAGE_KEY);
  return isValidRoute(stored) ? stored : DEFAULT;
}

let startPage = readInitial();
const listeners = new Set<() => void>();

function setStartPage(value: string) {
  startPage = value;
  localStorage.setItem(STORAGE_KEY, value);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return startPage;
}

/** En que pantalla abre la app al entrar a "/" (preferencia local, no se
 * guarda en Firestore). Store compartido (no useState) por la misma razon
 * que useHiddenBalances/useZoomLevel. */
export function useStartPage() {
  const page = useSyncExternalStore(subscribe, getSnapshot);
  const setPage = useCallback((value: string) => setStartPage(value), []);
  return { page, setPage };
}
