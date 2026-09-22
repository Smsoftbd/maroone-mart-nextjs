import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SectionHeader } from "./SectionHeader";
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
    "flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm tabular-nums transition-colors";

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-slate-600">
          {t("showing_x_of_y", "Showing :count of :total")
            .replace(":count", String(products.length))
            .replace(":total", String(total))}
        </p>

        {lastPage > 1 && (
          <nav aria-label="Pagination" className="flex items-center gap-1.5">
            <span className={`${pagerBtn} pointer-events-none border-slate-200 text-slate-300`} aria-hidden>
              <ChevronLeft className="h-4 w-4" />
            </span>
            {pages.map((p) => (
              <Link
                key={p}
                href={pageHref(p)}
                aria-current={p === 1 ? "page" : undefined}
                className={
                  p === 1
                    ? `${pagerBtn} border-brand-500 text-brand-500 font-semibold`
                    : `${pagerBtn} border-transparent text-slate-700 hover:border-slate-200`
                }
              >
                {p}
              </Link>
            ))}
            <Link
              href={pageHref(2)}
              aria-label="Next page"
              className={`${pagerBtn} border-slate-200 text-slate-700 hover:border-brand-500 hover:text-brand-500`}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </nav>
        )}
      </div>
    </section>
  );
}
