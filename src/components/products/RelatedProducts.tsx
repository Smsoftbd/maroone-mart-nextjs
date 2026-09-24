"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
    <section id="same-category-products" className="phone-band mt-12 lg:mt-16">
      <div className="section-panel">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-bold md:text-[22px]">
            {t("related_products", "Related Products")}
          </h2>
          <Link
            href={`/products?category=${encodeURIComponent(categorySlug)}`}
            className="ruled-link"
          >
            {t("view_all", "View All")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="product-grid">
            {[...Array(5)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <ProductGrid
            products={products}
            currency={currency}
            list={{ id: "related_products", name: "Related products" }}
          />
        )}
      </div>
    </section>
  );
}
