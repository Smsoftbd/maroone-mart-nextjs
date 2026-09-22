import { ProductCarousel } from "@/components/products/ProductCarousel";
import { ProductGrid } from "@/components/products/ProductGrid";
import type { ItemList } from "@/lib/analytics/track";
import type { Product } from "@/lib/api/types";
import { SectionHeader } from "./SectionHeader";

interface HomeProductSectionProps {
  title: string;
  subtitle?: string | null;
  /** "View all" target; omitted when the owner turned the link off. */
  viewAllHref?: string;
  viewAllLabel: string;
  products: Product[];
  currency: string;
  list: ItemList;
  layout: "grid" | "slider";
  icon?: React.ReactNode;
}

/** Product block of the homepage (featured, new arrivals, top selling …). */
export function HomeProductSection({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
  products,
  currency,
  list,
  layout,
  icon,
}: HomeProductSectionProps) {
  if (!products.length) return null;
  return (
    <section className="home-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-reveal>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        viewAllHref={viewAllHref}
        viewAllLabel={viewAllLabel}
      />
      {layout === "grid" ? (
        <ProductGrid products={products} currency={currency} list={list} />
      ) : (
        <ProductCarousel products={products} currency={currency} list={list} />
      )}
    </section>
  );
}
