import { HomeProductSection } from "./FeaturedProducts";
import type { HomepageCategory, Product } from "@/lib/api/types";

export interface CategoryProducts {
  category: HomepageCategory;
  products: Product[];
}

interface CategoryProductSectionsProps {
  sections: CategoryProducts[];
  currency: string;
  viewAllLabel: string;
}

/** One product block per homepage category (SHOES, FULL SLEEVE …), each with "See All". */
export function CategoryProductSections({ sections, currency, viewAllLabel }: CategoryProductSectionsProps) {
  return (
    <>
      {sections.map(({ category, products }) => (
        <HomeProductSection
          key={category.id}
          title={category.name}
          viewAllHref={`/products?category=${category.slug}`}
          viewAllLabel={viewAllLabel}
          products={products}
          currency={currency}
          list={{ id: `home_category_${category.slug}`, name: category.name }}
        />
      ))}
    </>
  );
}
