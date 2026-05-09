"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { setTheme } from "./theme-provider";

export function ThemeToggle() {
  const [theme, setLocalTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as "dark" | "light" | null;
    setLocalTheme(current ?? "dark");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setLocalTheme(next);
  };

  return (
    <Button variant="default" size="icon" aria-label="Toggle theme" title="Toggle theme" onClick={toggle}>
      {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
}
