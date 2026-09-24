"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useTheme } from "@/components/providers/StoreConfigProvider";
import { cn } from "@/lib/utils/cn";

export interface InfoPanel {
  id: string;
  label: string;
  content: ReactNode;
  /** Small coloured tile beside the label (reference: file / phone / question). */
  icon?: ReactNode;
  /** Background of that tile. */
  tone?: string;
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
    // Phones: the tabs become a jump nav and every panel is shown, stacked
    // between grey bands (see .info-tabs in globals.css).
    const select = (id: string) => {
      setActive(id);
      if (window.matchMedia("(max-width: 767px)").matches) {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    return (
      <section className="info-tabs pdp-tabs">
        <div role="tablist" className="pdp-tablist scrollbar-none">
          {panels.map((p) => (
            <button
              key={p.id}
              role="tab"
              type="button"
              id={`${p.id}-tab`}
              aria-selected={active === p.id}
              aria-controls={p.id}
              onClick={() => select(p.id)}
              className={cn("pdp-tab", active === p.id && "is-active")}
            >
              {p.label}
            </button>
          ))}
        </div>
        {panels.map((p, i) => (
          <div
            key={p.id}
            id={p.id}
            role="tabpanel"
            aria-labelledby={`${p.id}-tab`}
            // Class, not `hidden`: phones show every panel (preflight's [hidden] is !important).
            className={cn("pdp-tabpanel scroll-mt-32", active !== p.id && "md:hidden")}
          >
            {i > 0 && <h2 className="pdp-tabpanel-title md:hidden">{p.label}</h2>}
            {p.content}
          </div>
        ))}
      </section>
    );
  }

  if (layout === "accordion") {
    return (
      <section className="pdp-panels mt-8">
        {panels.map((p, i) => (
          <details key={p.id} id={p.id} open={i === 0} className="group scroll-mt-32">
            <summary>
              {p.icon && (
                <span className="panel-icon" style={{ background: p.tone ?? "var(--color-brand-500)" }}>
                  {p.icon}
                </span>
              )}
              {p.label}
              <ChevronDown className="ml-auto h-[18px] w-[18px] text-[var(--color-text-muted)] transition-transform group-open:rotate-180" />
            </summary>
            <div className="panel-body">{p.content}</div>
          </details>
        ))}
      </section>
    );
  }

  // Stacked: a jump nav (centered, hairline-separated on desktop) over every
  // section, exactly like the reference storefront.
  return (
    <section className="info-stacked mt-6 md:mt-8">
      <nav className="sticky top-[3.25rem] z-10 bg-[var(--color-surface-0)] border-b border-[var(--color-border)] md:static md:border-b-0">
        <ul className="grid grid-flow-col auto-cols-fr overflow-x-auto scrollbar-none">
          {panels.map((p, i) => (
            <li key={p.id}>
              <a
                href={`#${p.id}`}
                className={cn(
                  "block whitespace-nowrap px-3 py-3 text-center text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] hover:text-brand-ink transition-colors md:py-4",
                  i > 0 && "md:border-l md:border-[var(--color-border)]"
                )}
              >
                <span className="md:hidden">{p.label.replace(/\s*\(\d+\)$/, "")}</span>
                <span className="hidden md:inline">{p.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-6">
        {panels.map((p, i) => (
          <div
            key={p.id}
            id={p.id}
            className={cn(
              "scroll-mt-32 lg:scroll-mt-48",
              // Phones replace this rule with a grey band (see globals.css).
              i > 0 && "mt-10 border-t border-[var(--color-border)] pt-8"
            )}
          >
            {/* The description opens with its own heading in the copy. */}
            {i > 0 && (
              <h2 className="mb-5 text-lg font-bold text-[var(--color-text-primary)] max-md:text-[22px]">
                {p.label}
              </h2>
            )}
            {p.content}
          </div>
        ))}
      </div>
    </section>
  );
}
