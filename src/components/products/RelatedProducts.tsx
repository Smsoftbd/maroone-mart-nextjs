"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductGrid } from "./ProductGrid";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { useI18n } from "@/lib/i18n/I18nProvider";
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
  const { t, locale } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/products?category=${categorySlug}&per_page=8&lang=${encodeURIComponent(locale)}`,
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
  }, [categorySlug, excludeSlug, locale]);

  if (!isLoading && products.length === 0) return null;

  return (
    <section id="same-category-products" className="mt-16 lg:mt-24 pt-10 border-t border-[var(--color-border)]">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="font-display text-xl sm:text-2xl font-semibold">
          {t("you_may_also_like", "You may also like")}
        </h2>
        <Link
          href={`/products?category=${encodeURIComponent(categorySlug)}`}
          className="shrink-0 text-sm font-medium text-[var(--color-text-secondary)] underline-offset-4 hover:text-[var(--color-text-primary)] hover:underline"
        >
          {t("view_all", "View all")}
        </Link>
      </div>
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
