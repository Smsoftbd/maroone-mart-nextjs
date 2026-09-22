"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/StoreConfigProvider";
import { useT } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils/cn";

/** Current scheme: the saved choice, else the device (only when mode = auto). */
function currentScheme(): "light" | "dark" {
  const root = document.documentElement;
  if (root.dataset.theme === "dark" || root.dataset.theme === "light") return root.dataset.theme;
  return document.body.dataset.colorScheme === "auto" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Sun/moon switch for dark.mode = auto | toggle. Both icons render and CSS
 * shows the right one (html[data-theme] / prefers-color-scheme), so there's
 * no hydration flash.
 */
export function ColorSchemeToggle({ className }: { className?: string }) {
  const { dark } = useTheme();
  const t = useT();
  if (dark.mode === "off") return null;

  const toggle = () => {
    const next = currentScheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn("scheme-toggle", className)}
      aria-label={t("toggle_dark_mode", "Toggle dark mode")}
    >
      <Moon className="scheme-icon-dark h-5 w-5" />
      <Sun className="scheme-icon-light h-5 w-5" />
    </button>
  );
}
