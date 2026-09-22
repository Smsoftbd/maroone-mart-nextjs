import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFilters, ProductFilterSidebar } from "@/components/products/ProductFilters";
import { ProductListLoader } from "@/components/products/ProductListLoader";
import { ProductSort } from "@/components/products/ProductSort";
import { Pagination } from "@/components/ui/Pagination";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { getProducts, getCategories, getBrands, getProductFilters } from "@/lib/api/products";
import { getStore, getHomepageCategories } from "@/lib/api/store";
import { generatePageMetadata } from "@/lib/utils/metadata";
import { getServerT } from "@/lib/i18n/server";
import type { Category } from "@/lib/api/types";

export const revalidate = 300;

const PER_PAGE = 20;
const TOP_CATEGORY_COUNT = 5;

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

function findCategory(cats: Category[], slug: string): Category | undefined {
  for (const c of cats) {
    if (c.slug === slug) return c;
    const hit = c.children?.length ? findCategory(c.children, slug) : undefined;
    if (hit) return hit;
  }
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { search, sort, price_min, price_max, page = "1" } = params;

  const categories = toArray(params.category);
  const brands = toArray(params.brands);
  const attribute_values = toArray(params.attribute_values);

  const [{ data: products, meta }, categoryTree, brandList, filters, store, homepageCategories] =
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
      getHomepageCategories().catch(() => []),
    ]);

  const t = await getServerT();
  const currentCategory =
    categories.length === 1 ? findCategory(categoryTree, categories[0]) : undefined;

  const topCategories = (
    homepageCategories.length
      ? homepageCategories
      : categoryTree.map(({ id, name, slug, image }) => ({ id, name, slug, image }))
  ).slice(0, TOP_CATEGORY_COUNT);

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
    !!search;

  const crumbs = search
    ? [{ label: `${t("search", "Search")}: "${search}"` }]
    : currentCategory
    ? [
        { label: t("categories", "Categories"), href: "/categories" },
        { label: currentCategory.name },
      ]
    : [{ label: t("all_products", "All Products") }];

  const { layout, page: pageOpts } = store.theme;
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

  return (
    <div>
      {pageOpts.breadcrumbs && (
        <div className="hidden border-b border-[var(--color-border)] md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumb items={[{ label: t("home", "Home"), href: "/" }, ...crumbs]} />
          </div>
        </div>
      )}

      {/* Category banner (layout.shop_banner) */}
      {layout.shop_banner && currentCategory && (
        <section className="hidden bg-[var(--color-neutral-surface-alt,var(--color-surface-100))] md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
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

      {topCategories.length > 0 && (
        <section className="border-b border-[var(--color-border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-8">
            <h2 className="mb-2.5 text-[15px] font-semibold text-[var(--color-text-primary)] md:mb-5 md:text-base">
              {t("top_5_categories", "Top 5 Categories")}
            </h2>
            <div className="-mx-3 flex gap-2 overflow-x-auto scrollbar-none px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0 lg:grid-cols-5">
              {topCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className={`flex shrink-0 items-center gap-2 rounded-lg border px-1.5 py-1.5 pr-3 transition-colors sm:w-auto sm:gap-3 sm:px-3 sm:py-3 ${
                    categories.includes(cat.slug)
                      ? "border-brand-500 bg-brand-500 text-[var(--color-primary-text)]"
                      : "border-slate-200 text-slate-800 hover:border-brand-500 sm:border-slate-100"
                  }`}
                >
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-100 sm:rounded-full">
                    {cat.image ? (
                      <Image src={cat.image} alt="" fill sizes="40px" className="object-contain p-1.5" />
                    ) : (
                      <span className="text-sm font-bold text-brand-ink">{cat.name[0]}</span>
                    )}
                  </span>
                  <span className="whitespace-nowrap text-[15px] sm:truncate sm:text-sm">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-10 md:pt-8 md:pb-16">
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
            <div className="mb-4 flex gap-3 sm:gap-4">
              {/* Phones: grey Sort + Filter buttons side by side. */}
              <Suspense fallback={null}>
                <div className="flex min-w-0 flex-1 sm:hidden">
                  <ProductSort variant="button" />
                </div>
              </Suspense>
              <Suspense fallback={null}>
                <ProductFilters {...filterProps} total={meta.total} />
              </Suspense>

              <div className="hidden flex-1 items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 sm:flex sm:px-3">
                <p className="text-sm text-slate-800 tabular-nums">
                  {t("x_products", ":count products").replace(":count", String(meta.total))}
                </p>
                <Suspense fallback={null}>
                  <ProductSort />
                </Suspense>
              </div>
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
                key={JSON.stringify(query)}
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
                <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-[var(--color-border)] pt-4 sm:mt-10 sm:flex-row sm:items-center sm:px-4 sm:pt-5">
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
