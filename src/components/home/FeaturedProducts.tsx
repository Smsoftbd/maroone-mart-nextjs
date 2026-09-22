import { Flame } from "lucide-react";
import { ProductCarousel } from "@/components/products/ProductCarousel";
import { getServerT } from "@/lib/i18n/server";
import type { ItemList } from "@/lib/analytics/track";
import type { Product } from "@/lib/api/types";
import { SectionHeader } from "./SectionHeader";

interface SectionProps {
  title: string;
  viewAllHref: string;
  products: Product[];
  currency: string;
  list: ItemList;
  icon?: React.ReactNode;
}

async function ProductSection({ title, viewAllHref, products, currency, list, icon }: SectionProps) {
  if (!products.length) return null;
  const t = await getServerT();
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SectionHeader
        title={title}
        icon={icon}
        viewAllHref={viewAllHref}
        viewAllLabel={t("view_all", "View All")}
      />
      <ProductCarousel
        products={products.slice(0, 12)}
        currency={currency}
        variant="shop"
        columns={5}
        list={list}
      />
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
      list={{ id: "featured_products", name: "Featured products" }}
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
      list={{ id: "new_arrivals", name: "New arrivals" }}
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
      list={{ id: "best_selling", name: "Best selling" }}
      icon={<Flame className="h-5 w-5 fill-brand-500 text-brand-500" />}
    />
  );
}
