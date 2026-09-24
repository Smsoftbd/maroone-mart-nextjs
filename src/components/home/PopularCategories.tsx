import { MobileViewAll, SectionHeader } from "./SectionHeader";
import { CategoryCarousel } from "./CategoryCarousel";
import { getServerT } from "@/lib/i18n/server";
import type { HomepageCategory } from "@/lib/api/types";

interface PopularCategoriesProps {
  categories: HomepageCategory[];
  title?: string | null;
  subtitle?: string | null;
  viewAll?: boolean;
}

/** Homepage category row: ruled header over a card carousel. */
export async function PopularCategories({ categories, title, subtitle, viewAll }: PopularCategoriesProps) {
  if (!categories.length) return null;
  const t = await getServerT();
  const href = viewAll ? "/categories" : undefined;
  const label = t("view_all", "View All");

  return (
    <section className="home-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-reveal>
      <SectionHeader
        title={title || t("popular_categories", "Popular Categories")}
        subtitle={subtitle}
        viewAllHref={href}
        viewAllLabel={label}
      />
      <CategoryCarousel categories={categories} />
      <MobileViewAll href={href} label={label} />
    </section>
  );
}
