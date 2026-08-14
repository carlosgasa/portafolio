import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "portafolio.section-colors";

type SectionColors = Record<string, string>;

function readStorage(): SectionColors {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SectionColors) : {};
  } catch {
    return {};
  }
}

/** Color de acento por seccion de navegacion, elegido por el usuario y
 * guardado localmente (preferencia visual, no dato financiero). */
export function useSectionColors() {
  const [colors, setColors] = useState<SectionColors>(readStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  }, [colors]);

  const setColor = useCallback((sectionTo: string, color: string) => {
    setColors((prev) => ({ ...prev, [sectionTo]: color }));
  }, []);

  const clearColor = useCallback((sectionTo: string) => {
    setColors((prev) => {
      const next = { ...prev };
      delete next[sectionTo];
      return next;
    });
  }, []);

  return { colors, setColor, clearColor };
}
