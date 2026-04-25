import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search } from "lucide-react";
import { getProducts } from "@/lib/api/products";
import { getStore } from "@/lib/api/store";

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Search: ${q}` : "Search" };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q, page = "1" } = await searchParams;

  if (!q) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState icon={Search} title="Search for products" description="Enter a keyword to find what you're looking for." />
      </div>
    );
  }

  const [{ data: products, meta }, store] = await Promise.all([
    getProducts({ search: q, page: Number(page), per_page: 24 }),
    getStore(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-2xl font-bold mb-2">
        Results for &ldquo;{q}&rdquo;
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        {meta.total} product{meta.total !== 1 ? "s" : ""} found
      </p>
      {products.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No products found"
          description={`We couldn't find anything matching "${q}".`}
          action={{ label: "Browse All Products", href: "/products" }}
        />
      ) : (
        <>
          <ProductGrid products={products} currency={store.currency_symbol} />
          <Suspense fallback={null}>
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              total={meta.total}
            />
          </Suspense>
        </>
      )}
    </div>
  );
}
