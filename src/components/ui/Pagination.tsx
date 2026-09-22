"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  /** "boxed": square bordered buttons, rendered even for a single page. */
  variant?: "default" | "boxed";
}

/** Page numbers to render, with `null` marking a gap: 1 … 4 5 6 … 20 */
function pageItems(current: number, last: number): (number | null)[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const start = Math.max(2, Math.min(current - 1, last - 4));
  const end = Math.min(last - 1, Math.max(current + 1, 5));
  const items: (number | null)[] = [1];
  if (start > 2) items.push(null);
  for (let p = start; p <= end; p++) items.push(p);
  if (end < last - 1) items.push(null);
  items.push(last);
  return items;
}

export function Pagination({ currentPage, lastPage, variant = "default" }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (variant === "default" && lastPage <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  if (variant === "boxed") {
    const last = Math.max(1, lastPage);
    const box =
      "flex h-10 min-w-10 items-center justify-center rounded-md border px-2 text-sm tabular-nums transition-colors";
    const arrowBox = "w-16 border-slate-200 text-slate-500 hover:border-brand-500 hover:text-brand-ink";
    const disabled = "pointer-events-none opacity-50";

    return (
      <nav className="flex items-center gap-2" aria-label="Pagination">
        <Link
          href={buildHref(currentPage - 1)}
          aria-disabled={currentPage <= 1}
          tabIndex={currentPage <= 1 ? -1 : undefined}
          className={cn(box, arrowBox, currentPage <= 1 && disabled)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <ol className="flex items-center gap-2">
          {pageItems(currentPage, last).map((page, i) =>
            page === null ? (
              <li key={`gap-${i}`} className={cn(box, "border-slate-200 text-slate-500")}>
                …
              </li>
            ) : (
              <li key={page} className={cn(page !== currentPage && page !== 1 && page !== last && "hidden sm:block")}>
                <Link
                  href={buildHref(page)}
                  className={cn(
                    box,
                    page === currentPage
                      ? "border-brand-500 font-medium text-brand-ink"
                      : "border-slate-200 text-slate-700 hover:border-brand-500 hover:text-brand-ink"
                  )}
                  aria-current={page === currentPage ? "page" : undefined}
                >
                  {page}
                </Link>
              </li>
            )
          )}
        </ol>
        <Link
          href={buildHref(currentPage + 1)}
          aria-disabled={currentPage >= last}
          tabIndex={currentPage >= last ? -1 : undefined}
          className={cn(box, arrowBox, currentPage >= last && disabled)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </nav>
    );
  }

  const arrow =
    "inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm font-medium transition-colors hover:bg-surface-100";

  return (
    <nav
      className="mt-14 flex items-center justify-between gap-2 border-t border-[var(--color-border)] pt-6 sm:justify-center sm:gap-6"
      aria-label="Pagination"
    >
      <Link
        href={buildHref(currentPage - 1)}
        aria-disabled={currentPage === 1}
        tabIndex={currentPage === 1 ? -1 : undefined}
        className={cn(arrow, currentPage === 1 && "pointer-events-none opacity-30")}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Prev</span>
      </Link>

      {/* Compact indicator on mobile, full page list from sm up */}
      <span className="text-sm tabular-nums text-[var(--color-text-secondary)] sm:hidden">
        {currentPage} / {lastPage}
      </span>

      <ol className="hidden sm:flex items-center gap-1">
        {pageItems(currentPage, lastPage).map((page, i) =>
          page === null ? (
            <li key={`gap-${i}`} className="w-8 text-center text-sm text-[var(--color-text-muted)]">
              …
            </li>
          ) : (
            <li key={page}>
              <Link
                href={buildHref(page)}
                className={cn(
                  "flex h-10 min-w-10 items-center justify-center rounded-full px-2 text-sm tabular-nums transition-colors",
                  page === currentPage
                    ? "bg-[var(--color-text-primary)] font-medium text-[var(--color-surface-0)]"
                    : "text-[var(--color-text-secondary)] hover:bg-surface-100 hover:text-[var(--color-text-primary)]"
                )}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </Link>
            </li>
          )
        )}
      </ol>

      <Link
        href={buildHref(currentPage + 1)}
        aria-disabled={currentPage === lastPage}
        tabIndex={currentPage === lastPage ? -1 : undefined}
        className={cn(arrow, currentPage === lastPage && "pointer-events-none opacity-30")}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
