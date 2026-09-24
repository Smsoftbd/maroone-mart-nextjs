import type { Metadata } from "next";
import { Suspense } from "react";
import { PackageSearch } from "lucide-react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFilters, ProductFilterSidebar } from "@/components/products/ProductFilters";
import { ProductListLoader } from "@/components/products/ProductListLoader";
import { ProductSort } from "@/components/products/ProductSort";
import { ShopToolbar } from "@/components/products/ShopToolbar";
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS } from "@/lib/utils/shop";
import { SidebarProducts } from "@/components/products/SidebarProducts";
import { RecentlyViewed } from "@/components/products/RecentlyViewed";
import { Pagination } from "@/components/ui/Pagination";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { getProducts, getCategories, getBrands, getProductFilters, getFeaturedProducts, getBestSelling } from "@/lib/api/products";
import { getStore } from "@/lib/api/store";
import { generatePageMetadata } from "@/lib/utils/metadata";
import { getServerT } from "@/lib/i18n/server";
import type { Category, Product } from "@/lib/api/types";

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
    /** Special Offers: the minimum discount percentage ("50" | "30" | "1"). */
    discount?: string;
    search?: string;
    sort?: string;
    page?: string;
    per_page?: string;
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
  const perPage = (PER_PAGE_OPTIONS as readonly number[]).includes(Number(params.per_page))
    ? Number(params.per_page)
    : DEFAULT_PER_PAGE;

  const categories = toArray(params.category);
  const brands = toArray(params.brands);
  const attribute_values = toArray(params.attribute_values);

  const [{ data: allProducts, meta }, categoryTree, brandList, filters, store, sidebarProducts] =
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
        per_page: perPage,
      }),
      getCategories(),
      getBrands(),
      getProductFilters(),
      getStore(),
      // Sidebar "Featured products": the featured list, else best sellers.
      getFeaturedProducts()
        .then((f) => (f.length ? f : getBestSelling(5)))
        .then((l) => l.slice(0, 5))
        .catch(() => []),
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

  const pageTitle = search
    ? `${t("search", "Search")}: "${search}"`
    : currentCategory?.name ?? t("products", "Products");

  return (
    <div className="shop-page">
      <div className="max-w-7xl mx-auto pf-breadcrumb">
        <Breadcrumb items={[{ label: t("home", "Home"), href: "/" }, { label: pageTitle }]} />
      </div>

      <div className="max-w-7xl mx-auto pt-8 pb-16 max-md:pt-5 max-md:pb-10">
        {/* layout.filter_position: sidebar left/right on desktop, else the drawer */}
        <div className="shop">
          {layout.filter_position !== "drawer" && (
            <aside className="shop-filters">
              <Suspense fallback={null}>
                <ProductFilterSidebar {...filterProps} />
              </Suspense>
              <SidebarProducts
                title={t("featured_products", "Featured Products")}
                products={sidebarProducts}
                currency={store.currency_symbol}
              />
            </aside>
          )}
          <div className="min-w-0">
            {layout.shop_banner && currentCategory?.banner && !currentCategory.banner.includes("no_image") && (
              <div className="shop-banner">
                {/* eslint-disable-next-line @next/next/no-img-element -- banner keeps its own proportions */}
                <img src={currentCategory.banner} alt={currentCategory.name} />
              </div>
            )}
            <h1 className="pf-page-title shop-title">{pageTitle}</h1>
            {currentCategory?.description && (
              <div
                className="prose-content shop-description"
                dangerouslySetInnerHTML={{ __html: currentCategory.description }}
              />
            )}

            <Suspense fallback={null}>
              <ShopToolbar />
            </Suspense>

            {/* Phones: Sort + Filter buttons side by side. */}
            <div className="mb-4 flex gap-3 lg:hidden">
              <Suspense fallback={null}>
                <div className="flex min-w-0 flex-1 sm:hidden">
                  <ProductSort variant="button" />
                </div>
              </Suspense>
              <Suspense fallback={null}>
                <ProductFilters {...filterProps} total={meta.total} />
              </Suspense>
            </div>

            <div className="shop-results" data-view="grid">
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
                  perPage={perPage}
                  total={meta.total}
                  currency={store.currency_symbol}
                  list={itemList}
                  mode={layout.pagination}
                />
              ) : (
                <>
                  <ProductGrid products={products} currency={store.currency_symbol} list={itemList} />
                  {meta.last_page > 1 && (
                    <div className="shop-pagination">
                      <Suspense fallback={null}>
                        <Pagination currentPage={meta.current_page} lastPage={meta.last_page} total={meta.total} />
                      </Suspense>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <RecentlyViewed currency={store.currency_symbol} />
    </div>
  );
}
