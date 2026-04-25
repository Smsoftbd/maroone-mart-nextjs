"use client";

import { useEffect, useState } from "react";
import { ProductGrid } from "./ProductGrid";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import type { Product } from "@/lib/api/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_API_KEY!;

interface RelatedProductsProps {
  categorySlug: string;
  excludeSlug: string;
  currency: string;
}

export function RelatedProducts({
  categorySlug,
  excludeSlug,
  currency,
}: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/products?category=${categorySlug}&per_page=8`,
          { headers: { "X-Api-Key": PUBLIC_KEY, Accept: "application/json" } }
        );
        if (!res.ok) return;
        const data = await res.json();
        const filtered = (data.data as Product[]).filter(
          (p) => p.slug !== excludeSlug
        );
        setProducts(filtered.slice(0, 4));
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    fetchRelated();
  }, [categorySlug, excludeSlug]);

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl font-semibold mb-6">
        Related Products
      </h2>
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <ProductGrid products={products} currency={currency} />
      )}
    </section>
  );
}
