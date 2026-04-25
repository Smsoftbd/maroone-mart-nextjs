"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
}

export function Pagination({ currentPage, lastPage, total }: PaginationProps) {
  const searchParams = useSearchParams();

  if (lastPage <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `?${params.toString()}`;
  };

  const pages = Array.from({ length: Math.min(lastPage, 7) }, (_, i) => {
    if (lastPage <= 7) return i + 1;
    if (currentPage <= 4) return i + 1;
    if (currentPage >= lastPage - 3) return lastPage - 6 + i;
    return currentPage - 3 + i;
  });

  return (
    <nav
      className="flex items-center justify-center gap-1 py-8"
      aria-label="Pagination"
    >
      <Link
        href={buildHref(currentPage - 1)}
        aria-disabled={currentPage === 1}
        className={cn(
          "p-2 rounded-lg border border-[var(--color-border)] hover:bg-surface-100 transition-colors",
          currentPage === 1 && "pointer-events-none opacity-40"
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {pages.map((page) => (
        <Link
          key={page}
          href={buildHref(page)}
          className={cn(
            "min-w-[2.25rem] h-9 flex items-center justify-center rounded-lg text-sm transition-colors",
            page === currentPage
              ? "bg-brand-500 text-white font-medium"
              : "border border-[var(--color-border)] hover:bg-surface-100"
          )}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </Link>
      ))}

      <Link
        href={buildHref(currentPage + 1)}
        aria-disabled={currentPage === lastPage}
        className={cn(
          "p-2 rounded-lg border border-[var(--color-border)] hover:bg-surface-100 transition-colors",
          currentPage === lastPage && "pointer-events-none opacity-40"
        )}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Link>

      <span className="ml-2 text-sm text-[var(--color-text-muted)]">
        {total} total
      </span>
    </nav>
  );
}
