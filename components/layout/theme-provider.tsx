"use client";

import { useEffect } from "react";

const STORAGE_KEY = "hw-theme";

export function ThemeProvider() {
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") {
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);
  return null;
}

export function setTheme(value: "dark" | "light") {
  document.documentElement.setAttribute("data-theme", value);
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {}
}
