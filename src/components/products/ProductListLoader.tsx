"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ProductGrid } from "./ProductGrid";
import { RefreshCw } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { useT } from "@/lib/i18n/I18nProvider";
import { loadProductsPage } from "@/app/(store)/products/actions";
import type { ItemList } from "@/lib/analytics/track";
import type { Product } from "@/lib/api/types";

interface ProductListLoaderProps {
  initial: Product[];
  query: Parameters<typeof loadProductsPage>[0];
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  currency: string;
  list?: ItemList;
  /** layout.pagination: a "Load more" button, or loading as the visitor scrolls. */
  mode: "load_more" | "infinite";
}

/** Shop grid that appends further pages in place (no page links). */
export function ProductListLoader({
  initial,
  query,
  currentPage,
  lastPage: initialLast,
  perPage,
  total,
  currency,
  list,
  mode,
}: ProductListLoaderProps) {
  const t = useT();
  const [products, setProducts] = useState(initial);
  const [page, setPage] = useState(currentPage);
  const [lastPage, setLastPage] = useState(initialLast);
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sentinel = useRef<HTMLDivElement>(null);
  const hasMore = page < lastPage;

  const loadMore = () => {
    if (isPending || !hasMore) return;
    startTransition(async () => {
      try {
        const res = await loadProductsPage(query, page + 1, perPage);
        setProducts((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...res.products.filter((p) => !seen.has(p.id))];
        });
        setPage(page + 1);
        setLastPage(res.lastPage);
        setFailed(false);
      } catch {
        setFailed(true);
      }
    });
  };

  useEffect(() => {
    if (mode !== "infinite" || !hasMore || failed) return;
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && loadMore(), {
      rootMargin: "600px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }); // re-arm after every load

  return (
    <div>
      <ProductGrid products={products} currency={currency} list={list} />
      <div ref={sentinel} className="mt-10 flex flex-col items-center gap-3">
        {hasMore && (mode === "load_more" || failed) && (
          <button type="button" onClick={loadMore} disabled={isPending} className="load-more-btn">
            {isPending ? (
              <Spinner size="sm" />
            ) : (
              <RefreshCw className="h-[18px] w-[18px]" strokeWidth={2} />
            )}
            {t("load_more_products", "Load More Products")}
          </button>
        )}
        {hasMore && mode === "infinite" && !failed && isPending && <Spinner size="md" />}
        {!hasMore && (
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t("showing_x_of_y", "Showing :count of :total")
              .replace(":count", String(products.length))
              .replace(":total", String(total))}
          </p>
        )}
      </div>
    </div>
  );
}
