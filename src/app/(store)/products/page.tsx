import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFilters } from "@/components/products/ProductFilters";
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

  return (
    <div className="bg-surface">
      <div className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={[{ label: t("home", "Home"), href: "/" }, ...crumbs]} />
        </div>
      </div>

      {topCategories.length > 0 && (
        <section className="border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="mb-5 text-base font-semibold text-[var(--color-text-primary)]">
              {t("top_5_categories", "Top 5 Categories")}
            </h2>
            <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-5">
              {topCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className={`flex w-48 shrink-0 items-center gap-3 rounded-lg border px-3 py-3 transition-colors sm:w-auto ${
                    categories.includes(cat.slug)
                      ? "border-brand-500 bg-brand-500 text-[var(--color-primary-text)]"
                      : "border-slate-100 text-slate-800 hover:border-brand-500"
                  }`}
                >
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-100">
                    {cat.image ? (
                      <Image src={cat.image} alt="" fill sizes="40px" className="object-contain p-1.5" />
                    ) : (
                      <span className="text-sm font-bold text-brand-ink">{cat.name[0]}</span>
                    )}
                  </span>
                  <span className="truncate text-sm">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Suspense fallback={null}>
            <ProductFilters
              categories={categoryTree}
              brands={brandList}
              filterAttributes={filters.attributes}
              priceRange={filters.price_range}
              currency={store.currency_symbol}
              total={meta.total}
            />
          </Suspense>

          <div className="flex flex-1 items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 sm:px-3">
            <p className="text-sm text-slate-800 tabular-nums">
              {t("x_products", ":count products").replace(":count", String(meta.total))}
            </p>
            <Suspense fallback={null}>
              <ProductSort />
            </Suspense>
          </div>
        </div>

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
            variant="shop"
            list={itemList}
          />
        )}

        {products.length > 0 && (
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:px-4">
            <p className="text-sm text-slate-700">
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
        )}
      </div>
    </div>
  );
}
