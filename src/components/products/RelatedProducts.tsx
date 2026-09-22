"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MobileViewAll } from "@/components/home/SectionHeader";
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
          `${BASE_URL}/products?category=${categorySlug}&per_page=12&lang=${encodeURIComponent(locale)}`,
          { headers: { "X-Api-Key": PUBLIC_KEY, Accept: "application/json" } }
        );
        if (!res.ok) return;
        const data = await res.json();
        const filtered = (data.data as Product[]).filter(
          (p) => p.slug !== excludeSlug
        );
        setProducts(filtered.slice(0, 10));
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
    <section id="same-category-products" className="phone-band mt-14 lg:mt-20">
      <div className="mb-4 flex items-end justify-between gap-4 md:mb-6">
        <h2 className="font-display text-[22px] font-bold sm:text-xl md:font-semibold">
          {t("more_from_category", "More products from this category")}
        </h2>
        <Link
          href={`/products?category=${encodeURIComponent(categorySlug)}`}
          className="hidden shrink-0 text-sm font-medium text-[var(--color-text-secondary)] underline-offset-4 md:inline hover:text-[var(--color-text-primary)] hover:underline"
        >
          {t("view_all", "View all")}
        </Link>
      </div>
      {isLoading ? (
        <div className="product-grid gap-3 sm:gap-4">
          {[...Array(5)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <ProductGrid
          products={products}
          currency={currency}
          variant="shop"
          list={{ id: "related_products", name: "Related products" }}
        />
      )}
      <MobileViewAll href={`/products?category=${encodeURIComponent(categorySlug)}`} label={t("view_all", "View all")} />
    </section>
  );
}
