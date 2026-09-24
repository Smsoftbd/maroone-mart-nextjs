"use client";

import { useEffect, useState } from "react";
import { ProductCarousel } from "./ProductCarousel";
import { useT } from "@/lib/i18n/I18nProvider";
import type { Product } from "@/lib/api/types";

const KEY = "recently-viewed";
const MAX = 12;

function read(): Product[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

/**
 * Remember a product for the "Recently viewed" rail. Only what a card needs
 * is kept, so the list stays small in localStorage.
 */
export function rememberProduct(product: Product) {
  const snapshot = {
    ...product,
    description: "",
    short_description: "",
    specifications: [],
    tags: [],
    images: product.images.slice(0, 2),
  } as Product;
  try {
    const list = [snapshot, ...read().filter((p) => p.id !== product.id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

/** Records the product page's product (rendered by the product page). */
export function TrackRecentlyViewed({ product }: { product: Product }) {
  useEffect(() => {
    rememberProduct(product);
  }, [product]);
  return null;
}

interface RecentlyViewedProps {
  currency: string;
  /** The product on screen, left out of its own rail. */
  excludeId?: number;
}

/** "Recently viewed products": a ruled-off rail of the visitor's last products. */
export function RecentlyViewed({ currency, excludeId }: RecentlyViewedProps) {
  const t = useT();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from storage after mount
    setProducts(read().filter((p) => p.id !== excludeId && Array.isArray(p.barcodes)));
  }, [excludeId]);

  if (!products.length) return null;

  return (
    <section className="pf-recent">
      <div className="max-w-7xl mx-auto">
        <div className="pf-recent-inner">
          <h2 className="pf-recent-title">{t("recently_viewed_products", "Recently Viewed Products")}</h2>
          <ProductCarousel products={products} currency={currency} list={{ id: "recently_viewed", name: "Recently viewed" }} />
        </div>
      </div>
    </section>
  );
}
