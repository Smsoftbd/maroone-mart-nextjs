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
        <section key={category.id} className="max-w-7xl mx-auto py-5 md:py-6">
          <div className="section-panel">
            <div className="ruled-head mb-6">
              <h2 className="ruled-title">{category.name}</h2>
              <span className="ruled-rule" aria-hidden />
              <Link href={`/products?category=${category.slug}`} className="ruled-btn">
                {t("view_all", "View All")}
              </Link>
            </div>
            <ProductGrid
              products={products.slice(0, 10)}
              currency={currency}
              list={{ id: `home_category_${category.slug}`, name: category.name }}
            />
          </div>
        </section>
      ))}
    </>
  );
}
