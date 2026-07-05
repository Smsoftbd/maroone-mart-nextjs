import Link from "next/link";
import { ProductCarousel } from "@/components/products/ProductCarousel";
import { getServerT } from "@/lib/i18n/server";
import type { Product } from "@/lib/api/types";

interface SectionProps {
  title: string;
  viewAllHref: string;
  products: Product[];
  currency: string;
}

async function ProductSection({ title, viewAllHref, products, currency }: SectionProps) {
  if (!products.length) return null;
  const t = await getServerT();
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl md:text-3xl font-semibold">{title}</h2>
        <Link
          href={viewAllHref}
          className="text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
        >
          {t("view_all", "View All")} →
        </Link>
      </div>
      <ProductCarousel products={products.slice(0, 12)} currency={currency} />
    </section>
  );
}

export async function FeaturedProducts({ products, currency }: { products: Product[]; currency: string }) {
  const t = await getServerT();
  return (
    <ProductSection
      title={t("featured_products", "Featured Products")}
      viewAllHref="/products?featured=1"
      products={products}
      currency={currency}
    />
  );
}

export async function NewArrivals({ products, currency }: { products: Product[]; currency: string }) {
  const t = await getServerT();
  return (
    <ProductSection
      title={t("new_arrivals", "New Arrivals")}
      viewAllHref="/products?sort=new"
      products={products}
      currency={currency}
    />
  );
}

export async function BestSelling({ products, currency }: { products: Product[]; currency: string }) {
  const t = await getServerT();
  return (
    <ProductSection
      title={t("best_selling", "Best Selling")}
      viewAllHref="/products?sort=sales"
      products={products}
      currency={currency}
    />
  );
}
