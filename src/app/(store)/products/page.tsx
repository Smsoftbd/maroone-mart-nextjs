import type { Metadata } from "next";
import { Suspense } from "react";
import { PackageSearch } from "lucide-react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFilters, ProductFilterSidebar } from "@/components/products/ProductFilters";
import { ProductListLoader } from "@/components/products/ProductListLoader";
import { ProductSort } from "@/components/products/ProductSort";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { getProducts, getCategories, getBrands, getProductFilters } from "@/lib/api/products";
import { getStore } from "@/lib/api/store";
import { generatePageMetadata } from "@/lib/utils/metadata";
import { getServerT } from "@/lib/i18n/server";
import { ProductCategorySelect } from "@/components/products/ProductCategorySelect";
import type { Category, Product } from "@/lib/api/types";

export const revalidate = 300;

const PER_PAGE = 20;

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore();
  return generatePageMetadata({
    title: `Products — ${store.name}`,
    description: `Shop all products at ${store.name}`,
    url: "/products",
  });
}

type RawParam = string | string[] | undefined;

interface PageProps {
  searchParams: Promise<{
    category?: RawParam;
    brands?: RawParam;
    attribute_values?: RawParam;
    price_min?: string;
    price_max?: string;
    /** Special Offers: the minimum discount percentage ("50" | "30" | "1"). */
    discount?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

/** Best discount across a product's barcodes, as a whole percentage. */
function discountPercent(product: Product): number {
  return product.barcodes.reduce((best, b) => {
    const price = Math.max(b.effective_price ?? 0, 0);
    const original = b.price ?? 0;
    if (!(original > price && price > 0)) return best;
    return Math.max(best, Math.round(((original - price) / original) * 100));
  }, 0);
}

const toArray = (v: RawParam): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

function findCategory(cats: Category[], slug: string): Category | undefined {
  for (const c of cats) {
    if (c.slug === slug) return c;
    const hit = c.children?.length ? findCategory(c.children, slug) : undefined;
    if (hit) return hit;
  }
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { search, sort, price_min, price_max, discount, page = "1" } = params;

  const categories = toArray(params.category);
  const brands = toArray(params.brands);
  const attribute_values = toArray(params.attribute_values);

  const [{ data: allProducts, meta }, categoryTree, brandList, filters, store] =
    await Promise.all([
      getProducts({
        categories,
        brands,
        attribute_values,
        search,
        sort,
        price_min: price_min ? Number(price_min) : undefined,
        price_max: price_max ? Number(price_max) : undefined,
        page: Number(page),
        per_page: PER_PAGE,
      }),
      getCategories(),
      getBrands(),
      getProductFilters(),
      getStore(),
    ]);

  // The API has no discount facet, so the Special Offers bucket is applied to
  // the page that came back.
  const minDiscount = discount ? Number(discount) : 0;
  const maxDiscount = discount === "30" ? 50 : discount === "1" ? 30 : Infinity;
  const products = minDiscount
    ? allProducts.filter((p) => {
        const pct = discountPercent(p);
        return pct >= minDiscount && pct < maxDiscount;
      })
    : allProducts;

  const t = await getServerT();
  const currentCategory =
    categories.length === 1 ? findCategory(categoryTree, categories[0]) : undefined;

  // GA4 list names stay untranslated so reports don't split by language.
  const itemList = search
    ? { id: "search_results", name: "Search results" }
    : categories.length === 1
    ? { id: `category_${categories[0]}`, name: currentCategory?.name || categories[0] }
    : { id: "all_products", name: "All products" };

  const hasFilters =
    categories.length > 0 ||
    brands.length > 0 ||
    attribute_values.length > 0 ||
    !!price_min ||
    !!price_max ||
    !!discount ||
    !!search;

  const { layout } = store.theme;
  const filterProps = {
    categories: categoryTree,
    brands: brandList,
    filterAttributes: filters.attributes,
    priceRange: filters.price_range,
    currency: store.currency_symbol,
  };
  const query = {
    categories,
    brands,
    attribute_values,
    search,
    sort,
    price_min: price_min ? Number(price_min) : undefined,
    price_max: price_max ? Number(price_max) : undefined,
  };
  const loaderKey = JSON.stringify({ ...query, discount });

  return (
    <div className="shop-page">
      {/* Category banner (layout.shop_banner) */}
      {layout.shop_banner && currentCategory && (
        <section className="hidden bg-[var(--color-neutral-surface,var(--color-surface))] md:block">
          <div className="shop-wide py-8 lg:py-10">
            <h1 className="text-2xl font-bold lg:text-3xl">{currentCategory.name}</h1>
            {currentCategory.description && (
              <div
                className="prose-content mt-2 max-w-3xl text-sm text-[var(--color-text-secondary)] [&_p:last-child]:mb-0"
                dangerouslySetInnerHTML={{ __html: currentCategory.description }}
              />
            )}
            <p className="mt-2 text-sm text-[var(--color-text-muted)] tabular-nums">
              {t("x_products", ":count products").replace(":count", String(meta.total))}
            </p>
          </div>
        </section>
      )}

      <div className="shop-wide pt-3 pb-10 md:pt-6 md:pb-16">
        {/* Toolbar: category and sort, right-aligned above the grid. */}
        <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
          <Suspense fallback={null}>
            <div className="hidden sm:block">
              <ProductCategorySelect categories={categoryTree} />
            </div>
          </Suspense>
          <Suspense fallback={null}>
            <div className="hidden sm:block">
              <ProductSort />
            </div>
          </Suspense>
        </div>

        {/* layout.filter_position: sidebar left/right on desktop, else the drawer */}
        <div className="shop">
          {layout.filter_position !== "drawer" && (
            <aside className="shop-filters">
              <Suspense fallback={null}>
                <ProductFilterSidebar {...filterProps} />
              </Suspense>
            </aside>
          )}
          <div className="min-w-0">
            {/* Phones: grey Sort + Filter buttons side by side. */}
            <div className="mb-4 flex gap-3 sm:hidden">
              <Suspense fallback={null}>
                <div className="flex min-w-0 flex-1">
                  <ProductSort variant="button" />
                </div>
              </Suspense>
              <Suspense fallback={null}>
                <ProductFilters {...filterProps} total={meta.total} />
              </Suspense>
            </div>

            <h1 className="mb-3 text-2xl font-bold md:hidden">
              {search ? `${t("search", "Search")}: "${search}"` : currentCategory?.name ?? t("all_products", "All Products")}
            </h1>

            {products.length === 0 ? (
              <EmptyState
                icon={PackageSearch}
                title={t("no_products_found", "No products found")}
                description={
                  hasFilters
                    ? t("no_products_filters_hint", "Try removing some filters or searching for something else.")
                    : t("no_products_hint", "Check back soon — new products are on the way.")
                }
                action={hasFilters ? { label: t("clear_filters", "Clear filters"), href: "/products" } : undefined}
                className="py-24"
              />
            ) : layout.pagination !== "numbers" ? (
              <ProductListLoader
                key={loaderKey}
                initial={products}
                query={query}
                currentPage={meta.current_page}
                lastPage={meta.last_page}
                perPage={PER_PAGE}
                total={meta.total}
                currency={store.currency_symbol}
                list={itemList}
                mode={layout.pagination}
              />
            ) : (
              <>
                <ProductGrid products={products} currency={store.currency_symbol} list={itemList} />
                <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-[var(--color-border)] pt-4 sm:mt-10 sm:flex-row sm:items-center sm:pt-5">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {t("showing_x_of_y", "Showing :count of :total")
                      .replace(":count", String(products.length))
                      .replace(":total", String(meta.total))}
                  </p>
                  <Suspense fallback={null}>
                    <Pagination
                      currentPage={meta.current_page}
                      lastPage={meta.last_page}
                      total={meta.total}
                      variant="boxed"
                    />
                  </Suspense>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
