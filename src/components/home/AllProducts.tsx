import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { MobileViewAll, SectionHeader } from "./SectionHeader";
import { getServerT } from "@/lib/i18n/server";
import type { Product } from "@/lib/api/types";

/** Page size of the /products listing the pager hands off to. */
const LISTING_PER_PAGE = 20;

interface AllProductsProps {
  products: Product[];
  total: number;
  currency: string;
}

export async function AllProducts({ products, total, currency }: AllProductsProps) {
  if (!products.length) return null;
  const t = await getServerT();
  const lastPage = Math.max(1, Math.ceil(total / LISTING_PER_PAGE));
  const pages = Array.from({ length: Math.min(lastPage, 3) }, (_, i) => i + 1);
  const pageHref = (p: number) => (p <= 1 ? "/products" : `/products?page=${p}`);

  const pagerBtn =
    "flex h-11 min-w-11 items-center justify-center rounded-md border px-2 text-base tabular-nums transition-colors md:h-8 md:min-w-8 md:text-sm";

  return (
    <section className="home-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-reveal>
      <SectionHeader
        title={t("all_products", "All Products")}
        viewAllHref="/products"
        viewAllLabel={t("view_all", "View All")}
      />

      <ProductGrid
        products={products}
        currency={currency}
        variant="shop"
        list={{ id: "home_all_products", name: "All products" }}
      />

      <div className="mt-4 flex flex-col items-start justify-between gap-4 border-t border-[var(--color-border)] pt-3 sm:flex-row sm:items-center md:mt-8 md:border-0 md:pt-0">
        <p className="text-sm text-[var(--color-text-primary)] md:text-slate-600">
          {t("showing_x_of_y", "Showing :count of :total")
            .replace(":count", String(products.length))
            .replace(":total", String(total))}
        </p>

        {lastPage > 1 && (
          <nav aria-label="Pagination" className="flex items-center gap-1.5">
            <span className={`${pagerBtn} pointer-events-none border-slate-200 text-slate-300 max-md:min-w-16`} aria-hidden>
              <ChevronLeft className="h-4 w-4" />
            </span>
            {pages.map((p) => (
              <Link
                key={p}
                href={pageHref(p)}
                aria-current={p === 1 ? "page" : undefined}
                className={
                  p === 1
                    ? `${pagerBtn} border-brand-500 text-brand-ink font-semibold`
                    : `${pagerBtn} border-slate-200 text-slate-700 md:border-transparent hover:border-slate-200`
                }
              >
                {p}
              </Link>
            ))}
            <Link
              href={pageHref(2)}
              aria-label="Next page"
              className={`${pagerBtn} border-slate-200 text-slate-700 hover:border-brand-500 hover:text-brand-ink max-md:min-w-16`}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </nav>
        )}
      </div>
      <MobileViewAll href="/products" label={t("view_all", "View All")} />
    </section>
  );
}
