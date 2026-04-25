import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductSort } from "@/components/products/ProductSort";
import { Pagination } from "@/components/ui/Pagination";
import { getProducts, getCategories, getBrands } from "@/lib/api/products";
import { getStore } from "@/lib/api/store";
import { generatePageMetadata } from "@/lib/utils/metadata";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore();
  return generatePageMetadata({
    title: `Products — ${store.name}`,
    description: `Shop all products at ${store.name}`,
    url: "/products",
  });
}

interface PageProps {
  searchParams: Promise<{ category?: string; brand?: string; search?: string; page?: string; sort?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { category, brand, search, page = "1" } = params;

  const [{ data: products, meta }, categories, brands, store] = await Promise.all([
    getProducts({
      category,
      brand,
      search,
      page: Number(page),
      per_page: 24,
    }),
    getCategories(),
    getBrands(),
    getStore(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-3xl font-bold mb-6">
        {search ? `Search: "${search}"` : category ? `${categories.find(c => c.slug === category)?.name || "Products"}` : "All Products"}
      </h1>
      <div className="flex gap-8">
        <Suspense fallback={null}>
          <ProductFilters
            categories={categories}
            brands={brands}
            activeCategory={category}
            activeBrand={brand}
          />
        </Suspense>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {meta.total} product{meta.total !== 1 ? "s" : ""} found
            </p>
            <Suspense fallback={null}>
              <ProductSort />
            </Suspense>
          </div>

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
