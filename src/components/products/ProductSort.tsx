"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowDownWideNarrow, Check, ChevronDown } from "lucide-react";
import { useT } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils/cn";

/** `select` = labelled dropdown; `button` = the phone's grey "Sort" button (same menu). */
export function ProductSort({ variant = "select" }: { variant?: "select" | "button" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const current = searchParams.get("sort") || "";
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const sortOptions = [
    { label: t("sort_featured", "Featured"), value: "" },
    { label: t("sort_newest", "Newest"), value: "new" },
    { label: t("sort_price_asc", "Price: Low to High"), value: "price_asc" },
    { label: t("sort_price_desc", "Price: High to Low"), value: "price_desc" },
    { label: t("sort_top_rated", "Top Rated"), value: "rating" },
    { label: t("sort_best_selling", "Best Selling"), value: "sales" },
  ];
  const currentLabel = sortOptions.find((o) => o.value === current)?.label ?? sortOptions[0].label;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const select = (value: string) => {
    setOpen(false);
    if (value === current) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("sort", value);
    else params.delete("sort");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products", { scroll: false });
  };

  return (
    <div ref={rootRef} className={cn("relative flex items-center gap-3 text-sm", variant === "button" && "min-w-0 flex-1")}>
      {variant === "button" ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={t("sort_products", "Sort products")}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2.5 rounded-lg bg-slate-200/70 px-4 text-[15px] text-slate-800 transition-colors hover:bg-slate-200",
            current && "text-brand-ink"
          )}
        >
          <ArrowDownWideNarrow className="h-5 w-5" strokeWidth={1.75} />
          <span className="truncate">{t("sort_button", "Sort")}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={t("sort_products", "Sort products")}
          className="shop-select"
        >
          <span className="truncate">
            {t("sort_by", "Sort by")}: {currentLabel}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200", open && "rotate-180")}
          />
        </button>
      )}

      {open && (
        <ul
          role="listbox"
          aria-label={t("sort_products", "Sort products")}
          className="absolute left-0 top-full z-30 mt-1 w-full min-w-56 sm:left-auto sm:right-0 sm:w-[288px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-surface py-1 shadow-lg shadow-black/5"
        >
          {sortOptions.map((o) => {
            const selected = o.value === current;
            return (
              <li key={o.value || "default"} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => select(o.value)}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-2 text-left transition-colors hover:bg-surface-50",
                    selected ? "font-medium text-brand-ink" : "text-slate-700"
                  )}
                >
                  {o.label}
                  {selected && <Check className="h-4 w-4" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
