import { ProductCarousel } from "@/components/products/ProductCarousel";
import { ProductGrid } from "@/components/products/ProductGrid";
import type { ItemList } from "@/lib/analytics/track";
import type { Product } from "@/lib/api/types";
import { SectionHeader, SeeAllButton } from "./SectionHeader";

interface HomeProductSectionProps {
  title: string;
  subtitle?: string | null;
  /** "See All" target; omitted when the owner turned the link off. */
  viewAllHref?: string;
  viewAllLabel: string;
  products: Product[];
  currency: string;
  list: ItemList;
  /** Appearance → Sections layout: a 5-up grid (Marooned) or a carousel. */
  layout?: "grid" | "slider";
  icon?: React.ReactNode;
}

/**
 * Product block of the homepage (category products, featured, new arrivals …):
 * big centered title, two rows of five cards, an outlined "See All" under them.
 */
export function HomeProductSection({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
  products,
  currency,
  list,
  layout = "grid",
  icon,
}: HomeProductSectionProps) {
  if (!products.length) return null;
  return (
    <section className="home-section pf-home-section mr-product-section max-w-7xl mx-auto" data-reveal>
      <SectionHeader title={title} subtitle={subtitle} icon={icon} />
      {layout === "slider" ? (
        <ProductCarousel products={products} currency={currency} list={list} />
      ) : (
        <ProductGrid products={products} currency={currency} list={list} />
      )}
      <SeeAllButton href={viewAllHref} label={viewAllLabel} />
    </section>
  );
}
