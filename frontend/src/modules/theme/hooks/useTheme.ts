"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY, type Theme } from "../constants";

// The <html data-theme> attribute is the single source of truth (set first by THEME_SCRIPT);
// React just subscribes to it, so every toggle on the page stays in sync.
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
};
const getSnapshot = () => document.documentElement.getAttribute("data-theme") as Theme | null;
const getServerSnapshot = () => null; // unknown on the server: the toggle renders after hydration

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // private mode / storage blocked: the switch still works for this visit
    }
  };

  return { theme, toggle };
}
