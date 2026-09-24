"use client";

import { useState, useTransition } from "react";
import { ProductCarousel } from "@/components/products/ProductCarousel";
import { loadProductsPage } from "@/app/(store)/products/actions";
import { useT } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils/cn";
import type { ItemList } from "@/lib/analytics/track";
import type { Product } from "@/lib/api/types";
import { MobileViewAll, SectionHeader } from "./SectionHeader";

export interface ProductTab {
  slug: string;
  name: string;
}

interface TabbedProductsProps {
  title: string;
  subtitle?: string | null;
  tabs: ProductTab[];
  /** Products of the first tab, rendered on the server. */
  initial: Product[];
  currency: string;
  limit: number;
  list: ItemList;
  viewAllLabel: string;
}

/**
 * "New products" block of the reference storefront: the ruled title, a row
 * of category tabs (the active one in a rounded outline) and a carousel of
 * that category's newest products. Other tabs load on first click.
 */
export function TabbedProducts({ title, subtitle, tabs, initial, currency, limit, list, viewAllLabel }: TabbedProductsProps) {
  const t = useT();
  const [active, setActive] = useState(tabs[0]?.slug ?? "");
  const [cache, setCache] = useState<Record<string, Product[]>>({ [tabs[0]?.slug ?? ""]: initial });
  const [pending, startTransition] = useTransition();

  const select = (slug: string) => {
    setActive(slug);
    if (cache[slug]) return;
    startTransition(async () => {
      const { products } = await loadProductsPage({ categories: [slug], sort: "new" }, 1, limit).catch(() => ({
        products: [] as Product[],
      }));
      setCache((c) => ({ ...c, [slug]: products }));
    });
  };

  const products = cache[active];
  const href = `/products?category=${active}&sort=new`;

  return (
    <section className="home-section pf-home-section max-w-7xl mx-auto" data-reveal>
      <SectionHeader title={title} subtitle={subtitle}>
        {tabs.length > 1 && (
          <div className="pf-tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.slug}
                type="button"
                role="tab"
                aria-selected={tab.slug === active}
                onClick={() => select(tab.slug)}
                className={cn("pf-tab", tab.slug === active && "is-active")}
              >
                {tab.name}
              </button>
            ))}
          </div>
        )}
      </SectionHeader>

      <div className={cn("transition-opacity", pending && !products && "opacity-50")}>
        {products === undefined ? (
          <div className="pf-tab-empty">{t("loading", "Loading…")}</div>
        ) : products.length === 0 ? (
          <div className="pf-tab-empty">{t("no_products_found", "No products found")}</div>
        ) : (
          <ProductCarousel key={active} products={products} currency={currency} list={list} />
        )}
      </div>
      <MobileViewAll href={href} label={viewAllLabel} />
    </section>
  );
}
