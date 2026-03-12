"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "10px",
        border: "1px solid var(--dash-border)",
        background: "var(--dash-card)",
        color: "var(--dash-text-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {theme === "light" ? (
        <Moon style={{ width: "16px", height: "16px" }} />
      ) : (
        <Sun style={{ width: "16px", height: "16px" }} />
      )}
    </button>
  );
}
