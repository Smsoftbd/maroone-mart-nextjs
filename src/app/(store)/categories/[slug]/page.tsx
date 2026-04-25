import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Pagination } from "@/components/ui/Pagination";
import { getCategory, getProducts } from "@/lib/api/products";
import { getStore } from "@/lib/api/store";
import { generatePageMetadata } from "@/lib/utils/metadata";
import { breadcrumbSchema } from "@/lib/utils/structured-data";
import { Suspense } from "react";

export const revalidate = 300;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [category, store] = await Promise.all([getCategory(slug), getStore()]);
    return generatePageMetadata({
      title: `${category.name} — ${store.name}`,
      description: category.description || `Shop ${category.name} at ${store.name}`,
      image: category.image || undefined,
      url: `/categories/${slug}`,
    });
  } catch {
    return {};
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page = "1" } = await searchParams;

  let category, products, meta, store;
  try {
    [{ data: products, meta }, category, store] = await Promise.all([
      getProducts({ category: slug, page: Number(page), per_page: 24 }),
      getCategory(slug),
      getStore(),
    ]);
  } catch {
    notFound();
  }

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: category.name, url: `/categories/${slug}` },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbSchema(breadcrumbItems) }}
      />

      {category.banner && (
        <div
          className="relative h-48 rounded-2xl overflow-hidden mb-8 bg-surface-900"
          style={{
            backgroundImage: `url(${category.banner})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <h1 className="font-display text-4xl font-bold text-white">
              {category.name}
            </h1>
          </div>
        </div>
      )}

      <Breadcrumb
        items={breadcrumbItems.map((i) => ({ label: i.name, href: i.url }))}
      />

      {!category.banner && (
        <h1 className="font-display text-3xl font-bold mt-4 mb-6">
          {category.name}
        </h1>
      )}

      {category.description && (
        <p className="text-[var(--color-text-secondary)] mb-6 max-w-2xl">
          {category.description}
        </p>
      )}

      <div className="mt-4">
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          {meta.total} products
        </p>
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
  );
}
