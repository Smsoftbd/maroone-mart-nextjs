import { ProductCarousel } from "@/components/products/ProductCarousel";
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
  /** Accepted for the Appearance setting; the reference storefront always shows a carousel. */
  layout?: "grid" | "slider";
  icon?: React.ReactNode;
}

/** Product block of the homepage (featured, new arrivals, top selling …): ruled title over a 5-up carousel. */
export function HomeProductSection({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
  products,
  currency,
  list,
  icon,
}: HomeProductSectionProps) {
  if (!products.length) return null;
  return (
    <section className="home-section pf-home-section max-w-7xl mx-auto" data-reveal>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        viewAllHref={viewAllHref}
        viewAllLabel={viewAllLabel}
      />
      <ProductCarousel products={products} currency={currency} list={list} />
      <MobileViewAll href={viewAllHref} label={viewAllLabel} />
    </section>
  );
}
