import { ProductCarousel } from "@/components/products/ProductCarousel";
import { ProductGrid } from "@/components/products/ProductGrid";
import type { ItemList } from "@/lib/analytics/track";
import type { Product } from "@/lib/api/types";
import { MobileViewAll, SectionHeader } from "./SectionHeader";

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
  /** Phones: `rail` = side-scrolling cards, `list` = two rows of compact side-scrolling rows. */
  mobile?: "rail" | "list";
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
  mobile = "rail",
}: HomeProductSectionProps) {
  if (!products.length) return null;
  const grid = layout === "grid" || mobile === "list";
  return (
    <section
      className={`home-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${grid ? `mobile-${mobile}` : "mobile-carousel"}`}
      data-reveal
    >
      <SectionHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        viewAllHref={viewAllHref}
        viewAllLabel={viewAllLabel}
      />
      {grid ? (
        <ProductGrid products={products} currency={currency} list={list} />
      ) : (
        <ProductCarousel products={products} currency={currency} list={list} />
      )}
      <MobileViewAll href={viewAllHref} label={viewAllLabel} />
    </section>
  );
}
