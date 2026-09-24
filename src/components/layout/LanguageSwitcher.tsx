"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { setLocale } from "@/lib/i18n/actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { StoreLanguage } from "@/lib/api/types";

interface LanguageSwitcherProps {
  languages: StoreLanguage[];
  /** Overrides the trigger's default (brand-bar) styling. */
  buttonClassName?: string;
}

export function LanguageSwitcher({ languages, buttonClassName }: LanguageSwitcherProps) {
  const { locale } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Nothing to switch between — hide the control entirely.
  if (!languages || languages.length < 2) return null;

  const current =
    languages.find((l) => l.code === locale) ??
    languages.find((l) => l.is_default) ??
    languages[0];

  function choose(code: string) {
    setOpen(false);
    if (code === locale) return;
    startTransition(async () => {
      await setLocale(code);
      router.refresh();
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-sm font-medium hover:bg-white/15 transition-colors disabled:opacity-60",
          buttonClassName
        )}
        aria-label="Change language"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="hidden h-5 w-5 md:block" />
        <span className="text-xs font-semibold uppercase md:text-sm md:font-normal">{current.code}</span>
        <ChevronDown className={cn("hidden h-4 w-4 transition-transform md:block", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-1 min-w-44 rounded-lg border border-black/10 bg-surface py-1 shadow-lg z-50 text-[var(--color-text-primary)]"
        >
          {languages.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                role="option"
                aria-selected={lang.code === current.code}
                onClick={() => choose(lang.code)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-black/5"
              >
                <span>
                  {lang.native_name || lang.name}
                  <span className="ml-1.5 uppercase text-xs opacity-60">{lang.code}</span>
                </span>
                {lang.code === current.code && <Check className="h-4 w-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
