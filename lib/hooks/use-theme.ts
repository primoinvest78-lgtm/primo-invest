"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "primo-invest-theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("light", theme === "light");
}

/**
 * Fonte única de verdade para o tema claro/escuro.
 * Persistido em localStorage e refletido em <html data-theme>,
 * de onde os tokens de `globals.css` fazem o resto via CSS.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const initial: Theme = saved === "light" ? "light" : "dark";

    // localStorage só existe no cliente: o tema real é sincronizado aqui,
    // após a hidratação, para não divergir da marcação renderizada no servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initial);
    setMounted(true);
    applyTheme(initial);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";

      applyTheme(next);
      window.localStorage.setItem(STORAGE_KEY, next);

      return next;
    });
  }, []);

  return { theme, mounted, toggleTheme };
}
