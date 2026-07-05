import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ActiveFilters } from "@/components/products/ActiveFilters";
import { ProductSort } from "@/components/products/ProductSort";
import { Pagination } from "@/components/ui/Pagination";
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-3xl font-bold mb-6">{heading}</h1>
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        <Suspense fallback={null}>
          <ProductFilters
            categories={categoryTree}
            brands={brandList}
            filterAttributes={filters.attributes}
            priceRange={filters.price_range}
            currency={store.currency_symbol}
          />
        </Suspense>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {meta.total} {meta.total !== 1 ? t("products_lc", "products") : t("product_lc", "product")} {t("found", "found")}
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

          <ProductGrid products={products} currency={store.currency_symbol} />

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
