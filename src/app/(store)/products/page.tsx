import type { Metadata } from "next";
import { Suspense } from "react";
import { PackageSearch } from "lucide-react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ActiveFilters } from "@/components/products/ActiveFilters";
import { ProductSort } from "@/components/products/ProductSort";
import { Pagination } from "@/components/ui/Pagination";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { getProducts, getCategories, getBrands, getProductFilters } from "@/lib/api/products";
import { getStore } from "@/lib/api/store";
import { generatePageMetadata } from "@/lib/utils/metadata";
import { getServerT } from "@/lib/i18n/server";

export const revalidate = 300;

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
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

const toArray = (v: RawParam): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { search, sort, price_min, price_max, page = "1" } = params;

  const categories = toArray(params.category);
  const brands = toArray(params.brands);
  const attribute_values = toArray(params.attribute_values);

  const [{ data: products, meta }, categoryTree, brandList, filters, store] =
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
        per_page: 24,
      }),
      getCategories(),
      getBrands(),
      getProductFilters(),
      getStore(),
    ]);

  const t = await getServerT();
  const heading = search
    ? `${t("search", "Search")}: "${search}"`
    : categories.length === 1
    ? categoryTree.find((c) => c.slug === categories[0])?.name || t("products", "Products")
    : t("all_products", "All Products");

  // GA4 list names stay untranslated so reports don't split by language.
  const itemList = search
    ? { id: "search_results", name: "Search results" }
    : categories.length === 1
    ? {
        id: `category_${categories[0]}`,
        name: categoryTree.find((c) => c.slug === categories[0])?.name || categories[0],
      }
    : { id: "all_products", name: "All products" };

  const hasFilters =
    categories.length > 0 ||
    brands.length > 0 ||
    attribute_values.length > 0 ||
    !!price_min ||
    !!price_max ||
    !!search;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 lg:pt-10">
      <header className="mb-8 lg:mb-10">
        <Breadcrumb
          items={[
            { label: t("home", "Home"), href: "/" },
            { label: t("products", "Products"), href: "/products" },
            ...(heading !== t("all_products", "All Products") ? [{ label: heading }] : []),
          ]}
        />
        <div className="mt-4 flex items-end justify-between gap-4">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            {heading}
          </h1>
          <p className="hidden sm:block shrink-0 pb-1 text-sm text-[var(--color-text-muted)] tabular-nums">
            {meta.total} {meta.total !== 1 ? t("products_lc", "products") : t("product_lc", "product")}
          </p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
        <Suspense fallback={null}>
          <ProductFilters
            categories={categoryTree}
            brands={brandList}
            filterAttributes={filters.attributes}
            priceRange={filters.price_range}
            currency={store.currency_symbol}
            total={meta.total}
            toolbarSlot={
              <Suspense fallback={null}>
                <ProductSort />
              </Suspense>
            }
          />
        </Suspense>

        <div className="flex-1 min-w-0">
          <div className="hidden lg:flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4 mb-6">
            <p className="text-sm text-[var(--color-text-secondary)] tabular-nums">
              {t("showing", "Showing")}{" "}
              <span className="font-medium text-[var(--color-text-primary)]">
                {meta.total === 0 ? 0 : (meta.current_page - 1) * 24 + 1}–
                {Math.min(meta.current_page * 24, meta.total)}
              </span>{" "}
              {t("of", "of")} {meta.total}
            </p>
            <Suspense fallback={null}>
              <ProductSort />
            </Suspense>
          </div>

          <Suspense fallback={null}>
            <ActiveFilters
              categories={categoryTree}
              brands={brandList}
              filterAttributes={filters.attributes}
              currency={store.currency_symbol}
            />
          </Suspense>

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
          ) : (
            <ProductGrid
              products={products}
              currency={store.currency_symbol}
              variant="minimal"
              list={itemList}
            />
          )}

          <Suspense fallback={null}>
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              total={meta.total}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
