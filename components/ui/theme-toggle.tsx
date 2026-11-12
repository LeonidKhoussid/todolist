"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

// Adapted from Serenity UI's sliding toggle by Ayushmaan Singh.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const darkMode = mounted && resolvedTheme === "dark";

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label="Тёмная тема"
      aria-pressed={darkMode}
      disabled={!mounted}
      onClick={() => setTheme(darkMode ? "light" : "dark")}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-thumb" />
        <Moon className="theme-toggle-moon" size={16} />
        <Sun className="theme-toggle-sun" size={16} />
      </span>
    </button>
  );
}
