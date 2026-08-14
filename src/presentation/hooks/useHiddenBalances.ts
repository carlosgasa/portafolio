import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "portafolio.hide-balances";

let hidden = typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
const listeners = new Set<() => void>();

function setHidden(value: boolean) {
  hidden = value;
  localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return hidden;
}

/** Preferencia global (localStorage) para ocultar montos en toda la app.
 * Usa un store compartido en vez de useState por componente: si cada
 * boton llevara su propio estado, ocultar en una seccion no se reflejaria
 * en las demas hasta recargar la pagina (ya nos paso con los colores del
 * menu). */
export function useHiddenBalances() {
  const isHidden = useSyncExternalStore(subscribe, getSnapshot);
  const toggle = useCallback(() => setHidden(!hidden), []);
  return { isHidden, toggle };
}
