import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Slider } from "@/components/home/Slider";
import { FeatureHighlights } from "@/components/home/FeatureHighlights";
import { FlashSaleBanner } from "@/components/home/FlashSaleBanner";
import { HomeProductSection } from "@/components/home/FeaturedProducts";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { CategoryProductSections, type CategoryProducts } from "@/components/home/CategoryProductSections";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { SectionHeader } from "@/components/home/SectionHeader";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { BlogCard } from "@/components/blog/BlogCard";
import { getStore, getSliders, getHomepageCategories } from "@/lib/api/store";
import {
  getFlashSales,
  getNewArrivals,
  getBestSelling,
  getFeaturedProducts,
  getProducts,
} from "@/lib/api/products";
import { getBlogs } from "@/lib/api/content";
import { getServerT } from "@/lib/i18n/server";
import { generatePageMetadata } from "@/lib/utils/metadata";
import { organizationSchema, websiteSchema } from "@/lib/utils/structured-data";
import type { HomepageSection } from "@/lib/api/types";

export const revalidate = 300;

function normalizeKeywords(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.map((k) => String(k).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map((k) => k.trim()).filter(Boolean);
  }
  return undefined;
}

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore();
  return generatePageMetadata({
    title: store.seo.meta_title ?? store.name,
    description: store.seo.meta_description ?? store.tagline,
    image: store.logo,
    keywords: normalizeKeywords(store.seo.meta_keywords),
  });
}

/** Product blocks under the category tiles: the first homepage categories that have products. */
const CATEGORY_SECTIONS = 3;
/** Two rows of five cards per product block. */
const SECTION_PRODUCTS = 10;

/**
 * Homepage built from Appearance → Sections: enabled blocks in the owner's
 * order, with their titles and item counts. Styled like the Marooned
 * storefront: full-width banner slider, black branch marquee, category tiles,
 * then one product block per homepage category, each a 5-up grid with a
 * "See All" under it. Only enabled blocks are fetched.
 */
export default async function HomePage() {
  const [store, t] = await Promise.all([getStore(), getServerT()]);
  const sections = store.homepage_sections.filter((s) => s.enabled);
  const on = (key: string) => sections.find((s) => s.key === key);
  const limitOf = (key: string) => on(key)?.limit ?? SECTION_PRODUCTS;
  // Fetch only what an enabled block shows; a failing endpoint hides that block.
  const when = <T,>(key: string, load: () => Promise<T[]>): Promise<T[]> =>
    on(key) ? load().catch(() => []) : Promise.resolve([]);

  const homeCategories = await when("categories", () => getHomepageCategories());

  // A couple of spare categories, so empty ones don't leave fewer blocks.
  const categoryProducts: Promise<CategoryProducts[]> = Promise.all(
    homeCategories.slice(0, CATEGORY_SECTIONS * 2).map(async (category) => ({
      category,
      products: await getProducts({ categories: [category.slug], per_page: SECTION_PRODUCTS })
        .then((r) => r.data)
        .catch(() => []),
    }))
  ).then((all) => all.filter((c) => c.products.length > 0).slice(0, CATEGORY_SECTIONS));

  const [sliders, flashSales, featured, newArrivals, bestSelling, blogs, byCategory] = await Promise.all([
    when("banner", getSliders),
    when("flash_sale", () => getFlashSales()),
    when("featured_products", () => getFeaturedProducts()),
    when("new_arrivals", () => getNewArrivals(limitOf("new_arrivals"))),
    when("top_selling", () => getBestSelling(limitOf("top_selling"))),
    when("blog", async () => (store.features.blog ? (await getBlogs({ per_page: limitOf("blog") })).data : [])),
    categoryProducts,
  ]);

  const currency = store.currency_symbol;
  const { page } = store.theme;
  const seeAll = t("see_all", "See All");
  const marquee = <AnnouncementBar message={store.offer_message} placement="hero" />;

  const render = (s: HomepageSection): ReactNode => {
    const limit = s.limit ?? SECTION_PRODUCTS;
    const layout = s.layout ?? "grid";
    switch (s.key) {
      case "banner":
        return (
          <div key={s.key}>
            <div className="hero">
              <Slider sliders={sliders} autoplay={s.autoplay} interval={s.interval} />
            </div>
            {marquee}
            {page.trust_bar && <FeatureHighlights />}
          </div>
        );
      case "categories":
        return (
          <div key={s.key}>
            <CategoryGrid categories={homeCategories.slice(0, limit)} />
            <CategoryProductSections sections={byCategory} currency={currency} viewAllLabel={seeAll} />
          </div>
        );
      case "flash_sale":
        return (
          <FlashSaleBanner
            key={s.key}
            sales={flashSales}
            currency={currency}
            title={s.title}
            subtitle={s.subtitle}
            countdown={s.countdown}
            limit={limit}
            layout={layout}
            viewAll={s.view_all}
          />
        );
      case "featured_products":
        return (
          <HomeProductSection
            key={s.key}
            title={s.title || t("featured_products", "Featured Products")}
            subtitle={s.subtitle}
            viewAllHref={s.view_all ? "/products?featured=1" : undefined}
            viewAllLabel={seeAll}
            products={featured.slice(0, limit)}
            currency={currency}
            layout={layout}
            list={{ id: "featured_products", name: "Featured products" }}
          />
        );
      case "new_arrivals":
        return (
          <HomeProductSection
            key={s.key}
            title={s.title || t("new_arrivals", "New Arrivals")}
            subtitle={s.subtitle}
            viewAllHref={s.view_all ? "/products?sort=new" : undefined}
            viewAllLabel={seeAll}
            products={newArrivals.slice(0, limit)}
            currency={currency}
            layout={layout}
            list={{ id: "new_arrivals", name: "New arrivals" }}
          />
        );
      case "top_selling":
        return (
          <HomeProductSection
            key={s.key}
            title={s.title || t("best_selling", "Best Selling")}
            subtitle={s.subtitle}
            viewAllHref={s.view_all ? "/products?sort=sales" : undefined}
            viewAllLabel={seeAll}
            products={bestSelling.slice(0, limit)}
            currency={currency}
            layout={layout}
            list={{ id: "best_selling", name: "Best selling" }}
          />
        );
      case "blog":
        return blogs.length > 0 ? (
          <section key={s.key} className="home-section pf-home-section max-w-7xl mx-auto" data-reveal>
            <SectionHeader title={s.title || t("trending_now", "#Trending Now")} subtitle={s.subtitle} />
            <div className="pf-blog-grid">
              {blogs.slice(0, limit).map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        ) : null;
      case "newsletter":
        return page.newsletter_style === "hidden" ? null : (
          <NewsletterSection key={s.key} title={s.title} subtitle={s.subtitle} variant={page.newsletter_style} />
        );
      // "reviews": no store-wide testimonials endpoint yet; unknown keys are skipped.
      default:
        return null;
    }
  };

  return (
    <div className="pf-home mr-home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: organizationSchema(store) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: websiteSchema(store) }}
      />
      {/* No banner block: the marquee still opens the page. */}
      {!on("banner") && marquee}
      {sections.map(render)}
    </div>
  );
}
