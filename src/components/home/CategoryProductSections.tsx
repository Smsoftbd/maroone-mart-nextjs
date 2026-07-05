import Link from "next/link";
import { ProductGrid } from "@/components/products/ProductGrid";
import { getServerT } from "@/lib/i18n/server";
import type { HomepageCategory, Product } from "@/lib/api/types";

export interface CategoryProducts {
  category: HomepageCategory;
  products: Product[];
}

interface CategoryProductSectionsProps {
  sections: CategoryProducts[];
  currency: string;
}

export async function CategoryProductSections({
  sections,
  currency,
}: CategoryProductSectionsProps) {
  const visible = sections.filter((s) => s.products.length > 0);
  if (!visible.length) return null;
  const t = await getServerT();

  return (
    <>
      {visible.map(({ category, products }) => (
        <section
          key={category.id}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl md:text-3xl font-semibold">
              {category.name}
            </h2>
            <Link
              href={`/products?category=${category.slug}`}
              className="text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
            >
              {t("see_all", "See All")} →
            </Link>
          </div>
          <ProductGrid products={products.slice(0, 8)} currency={currency} />
        </section>
      ))}
    </>
  );
}
