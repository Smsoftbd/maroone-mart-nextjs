"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  /** Number shown as a small badge next to the title when > 0. */
  activeCount?: number;
  defaultOpen?: boolean;
}

export function FilterSection({
  title,
  children,
  activeCount = 0,
  defaultOpen = true,
}: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--color-border)] pb-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-1 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide">
          {title}
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-medium text-[var(--color-primary-text)]">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[var(--color-text-muted)] transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}
