import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "./SectionHeader";
import { getServerT } from "@/lib/i18n/server";
import type { HomepageCategory, StoreThemePage } from "@/lib/api/types";

interface PopularCategoriesProps {
  categories: HomepageCategory[];
  style: StoreThemePage["category_style"];
  title?: string | null;
  subtitle?: string | null;
  viewAll?: boolean;
}

/**
 * Category band (section.category_band_*). page.category_style picks tiles,
 * circles or chips; page.category_columns sets tiles/circles per row.
 */
export async function PopularCategories({ categories, style, title, subtitle, viewAll }: PopularCategoriesProps) {
  if (!categories.length) return null;
  const t = await getServerT();
  const bandText = "text-[var(--color-section-category-band-text,var(--color-secondary-text))]";

  return (
    <section className="home-section bg-[var(--color-section-category-band-bg,var(--color-secondary-500))]" data-reveal>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title={title || t("popular_categories", "Popular Categories")}
          subtitle={subtitle}
          viewAllHref={viewAll ? "/categories" : undefined}
          viewAllLabel={t("view_all", "View All")}
          inverted
        />

        {style === "chip" ? (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--color-section-category-card-bg,var(--color-surface))] py-1.5 pl-1.5 pr-4 text-sm font-medium text-[var(--color-text-primary)] transition-transform hover:-translate-y-0.5"
              >
                <span className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[var(--color-card-image-bg,var(--color-surface-100))]">
                  {cat.image ? (
                    <Image src={cat.image} alt="" fill sizes="28px" className="object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-brand-ink">{cat.name[0]}</span>
                  )}
                </span>
                {cat.name}
              </Link>
            ))}
          </div>
        ) : (
          <ul className={`category-grid category-grid-${style}`}>
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link href={`/products?category=${cat.slug}`} className="group flex flex-col items-center gap-2.5 text-center">
                  <span
                    className={
                      style === "circle"
                        ? "relative flex aspect-square w-full max-w-[140px] items-center justify-center overflow-hidden rounded-full bg-[var(--color-section-category-card-bg,var(--color-surface))] ring-4 ring-[color-mix(in_srgb,currentColor_20%,transparent)] transition-transform duration-[var(--effects-transition-speed,200ms)] group-hover:-translate-y-1"
                        : "store-card relative flex aspect-square w-full items-center justify-center overflow-hidden !bg-[var(--color-section-category-card-bg,var(--color-surface))]"
                    }
                  >
                    {cat.image ? (
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        sizes="(min-width: 1024px) 160px, 30vw"
                        className={style === "circle" ? "object-cover" : "object-contain p-3"}
                      />
                    ) : (
                      <span className="text-3xl font-bold text-brand-ink">{cat.name[0]}</span>
                    )}
                  </span>
                  <span className={`line-clamp-2 text-xs font-medium sm:text-sm ${bandText}`}>{cat.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
