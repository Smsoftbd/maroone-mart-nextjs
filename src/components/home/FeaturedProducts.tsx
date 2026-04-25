import Link from "next/link";
import { ProductGrid } from "@/components/products/ProductGrid";
import type { Product } from "@/lib/api/types";

interface SectionProps {
  title: string;
  viewAllHref: string;
  products: Product[];
  currency: string;
}

function ProductSection({ title, viewAllHref, products, currency }: SectionProps) {
  if (!products.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl md:text-3xl font-semibold">{title}</h2>
        <Link
          href={viewAllHref}
          className="text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
        >
          View All →
        </Link>
      </div>
      <ProductGrid products={products.slice(0, 8)} currency={currency} />
    </section>
  );
}

export function FeaturedProducts({ products, currency }: { products: Product[]; currency: string }) {
  return (
    <ProductSection
      title="Featured Products"
      viewAllHref="/products?featured=1"
      products={products}
      currency={currency}
    />
  );
}

export function NewArrivals({ products, currency }: { products: Product[]; currency: string }) {
  return (
    <ProductSection
      title="New Arrivals"
      viewAllHref="/products?sort=new"
      products={products}
      currency={currency}
    />
  );
}

export function TopSelling({ products, currency }: { products: Product[]; currency: string }) {
  return (
    <ProductSection
      title="Top Selling"
      viewAllHref="/products?sort=sales"
      products={products}
      currency={currency}
    />
  );
}
