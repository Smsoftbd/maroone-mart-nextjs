"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useTheme } from "@/components/providers/StoreConfigProvider";
import { cn } from "@/lib/utils/cn";

export interface InfoPanel {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * Description / reviews / Q&A on the product page, per product.info_layout:
 * tabs, an accordion (first open) or every section stacked with a jump nav.
 * In-page links (#product-reviews …) open the matching tab / accordion item.
 */
export function ProductInfoSections({ panels }: { panels: InfoPanel[] }) {
  const layout = useTheme().product.info_layout;
  const [active, setActive] = useState(panels[0]?.id);

  useEffect(() => {
    if (layout === "stacked") return;
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!panels.some((p) => p.id === id)) return;
      setActive(id);
      const el = document.getElementById(id);
      if (el instanceof HTMLDetailsElement) el.open = true;
      requestAnimationFrame(() => el?.scrollIntoView({ behavior: "smooth", block: "start" }));
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, [layout, panels]);

  if (layout === "tabs") {
    return (
      <section className="mt-8">
        <div role="tablist" className="flex gap-6 overflow-x-auto scrollbar-none border-b [border-bottom-style:var(--shape-divider-style,solid)] border-[var(--color-border)]">
          {panels.map((p) => (
            <button
              key={p.id}
              role="tab"
              type="button"
              id={`${p.id}-tab`}
              aria-selected={active === p.id}
              aria-controls={p.id}
              onClick={() => setActive(p.id)}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors",
                active === p.id
                  ? "border-brand-500 text-brand-ink"
                  : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {panels.map((p) => (
          <div
            key={p.id}
            id={p.id}
            role="tabpanel"
            aria-labelledby={`${p.id}-tab`}
            hidden={active !== p.id}
            className="scroll-mt-32 pt-6"
          >
            {p.content}
          </div>
        ))}
      </section>
    );
  }

  if (layout === "accordion") {
    return (
      <section className="mt-8 divide-y [--tw-divide-style:var(--shape-divider-style,solid)] divide-[var(--color-border)] border-y border-[var(--color-border)]">
        {panels.map((p, i) => (
          <details key={p.id} id={p.id} open={i === 0} className="group scroll-mt-32">
            <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-semibold text-[var(--color-text-primary)] [&::-webkit-details-marker]:hidden">
              {p.label}
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="pb-6">{p.content}</div>
          </details>
        ))}
      </section>
    );
  }

  return (
    <section className="mt-6">
      <nav className="sticky top-[3.25rem] lg:top-[7.5rem] z-10 bg-[var(--color-surface-0)] border-b border-[var(--color-border)]">
        <ul className="grid grid-flow-col auto-cols-fr overflow-x-auto scrollbar-none">
          {panels.map((p) => (
            <li key={p.id}>
              <a
                href={`#${p.id}`}
                className="block whitespace-nowrap px-3 py-3 text-center text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] border-b-2 border-transparent -mb-px hover:text-brand-ink hover:border-brand-500 transition-colors"
              >
                {p.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-6 space-y-10">
        {panels.map((p, i) => (
          <div
            key={p.id}
            id={p.id}
            className={cn("scroll-mt-32 lg:scroll-mt-48", i > 0 && "border-t border-[var(--color-border)] pt-6")}
          >
            <h2 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">{p.label}</h2>
            {p.content}
          </div>
        ))}
      </div>
    </section>
  );
}
