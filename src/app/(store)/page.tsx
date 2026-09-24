import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Slider } from "@/components/home/Slider";
import { FeatureHighlights } from "@/components/home/FeatureHighlights";
import { PopularCategories } from "@/components/home/PopularCategories";
import { FlashSaleBanner } from "@/components/home/FlashSaleBanner";
import { HomeProductSection } from "@/components/home/FeaturedProducts";
import { PromoBanners, groupBanners } from "@/components/home/PromoBanners";
import { TabbedProducts, type ProductTab } from "@/components/home/TabbedProducts";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { SectionHeader } from "@/components/home/SectionHeader";
import { BlogCard } from "@/components/blog/BlogCard";
import { getStore, getSliders, getHomepageCategories, getHeroBanners } from "@/lib/api/store";
import { getCategories } from "@/lib/api/products";
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
import type { Category, HomepageSection } from "@/lib/api/types";

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

/** Product blocks: a group of promo tiles follows each one, like the reference. */
const PRODUCT_KEYS = new Set(["flash_sale", "featured_products", "new_arrivals", "top_selling"]);

/**
 * "New products" tabs when the owner hasn't picked homepage categories: the
 * sub-categories of the category with the most of them (Makeup → Foundation,
 * Mascara …), as on the reference storefront.
 */
function fallbackTabs(categories: Category[]): ProductTab[] {
  const parent = [...categories].sort((a, b) => (b.children?.length ?? 0) - (a.children?.length ?? 0))[0];
  const source = parent?.children?.length ? parent.children : categories;
  return source
    .filter((c) => c.slug !== "uncategorized")
    .slice(0, 6)
    .map((c) => ({ slug: c.slug, name: c.name }));
}

/**
 * Homepage built from Appearance → Sections: enabled blocks in the owner's
 * order, with their titles and item counts. Styled like the reference
 * storefront: full-width banner, rows of promo tiles between the product
 * carousels, a tabbed "New products" block. Only enabled blocks are fetched.
 */
export default async function HomePage() {
  const [store, t, navCategories] = await Promise.all([
    getStore(),
    getServerT(),
    getCategories().catch(() => []),
  ]);
  const sections = store.homepage_sections.filter((s) => s.enabled);
  const on = (key: string) => sections.find((s) => s.key === key);
  const limitOf = (key: string) => on(key)?.limit ?? 12;
  // Fetch only what an enabled block shows; a failing endpoint hides that block.
  const when = <T,>(key: string, load: () => Promise<T[]>): Promise<T[]> =>
    on(key) ? load().catch(() => []) : Promise.resolve([]);

  const homeCategories = await when("categories", () => getHomepageCategories());
  // "New products" tabs: the owner's homepage categories, else sub-categories.
  const tabs: ProductTab[] = homeCategories.length
    ? homeCategories.slice(0, 6).map((c) => ({ slug: c.slug, name: c.name }))
    : fallbackTabs(navCategories);

  const [sliders, flashSales, featured, newArrivals, bestSelling, blogs, banners, firstTab] =
    await Promise.all([
      when("banner", getSliders),
      when("flash_sale", () => getFlashSales()),
      when("featured_products", () => getFeaturedProducts()),
      when("new_arrivals", () => getNewArrivals(limitOf("new_arrivals"))),
      when("top_selling", () => getBestSelling(limitOf("top_selling"))),
      when("blog", async () => (store.features.blog ? (await getBlogs({ per_page: limitOf("blog") })).data : [])),
      when("banner", getHeroBanners),
      on("new_arrivals") && tabs[0]
        ? getProducts({ categories: [tabs[0].slug], sort: "new", per_page: limitOf("new_arrivals") })
            .then((r) => r.data)
            .catch(() => [])
        : Promise.resolve([]),
    ]);

  const currency = store.currency_symbol;
  const { page } = store.theme;
  const viewAll = t("view_all", "View All");
  // Promo tiles in rows of 4 and 3: the first row under the banner, then one
  // row after each product block.
  const bannerRows = groupBanners(banners);
  let rowIndex = 0;

  const render = (s: HomepageSection): ReactNode => {
    const limit = s.limit ?? 12;
    const layout = s.layout ?? "slider";
    switch (s.key) {
      case "banner":
        return (
          <div key={s.key}>
            <div className="hero">
              <Slider sliders={sliders} autoplay={s.autoplay} interval={s.interval} />
            </div>
            {page.trust_bar && <FeatureHighlights />}
          </div>
        );
      case "categories":
        // Picked categories drive the "New products" tabs instead.
        return on("new_arrivals") ? null : (
          <PopularCategories
            key={s.key}
            categories={homeCategories.slice(0, limit)}
            title={s.title}
            subtitle={s.subtitle}
            viewAll={s.view_all}
          />
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
            viewAllLabel={viewAll}
            products={featured.slice(0, limit)}
            currency={currency}
            layout={layout}
            list={{ id: "featured_products", name: "Featured products" }}
          />
        );
      case "new_arrivals":
        return tabs.length > 0 && firstTab.length > 0 ? (
          <TabbedProducts
            key={s.key}
            title={s.title || t("new_products", "New Products")}
            subtitle={s.subtitle}
            tabs={tabs}
            initial={firstTab}
            currency={currency}
            limit={limit}
            list={{ id: "new_arrivals", name: "New arrivals" }}
            viewAllLabel={viewAll}
          />
        ) : (
          <HomeProductSection
            key={s.key}
            title={s.title || t("new_products", "New Products")}
            subtitle={s.subtitle}
            viewAllHref={s.view_all ? "/products?sort=new" : undefined}
            viewAllLabel={viewAll}
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
            viewAllLabel={viewAll}
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
    <div className="pf-home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: organizationSchema(store) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: websiteSchema(store) }}
      />

      {sections.map((s) => {
        const block = render(s);
        const row =
          (s.key === "banner" || (block && PRODUCT_KEYS.has(s.key))) && bannerRows[rowIndex]
            ? bannerRows[rowIndex++]
            : null;
        return (
          <div key={s.key} className="contents">
            {block}
            {row && <PromoBanners banners={row} />}
          </div>
        );
      })}
      {/* Rows not used yet (e.g. no banner block) go at the end. */}
      {bannerRows.slice(rowIndex).map((row, i) => (
        <PromoBanners key={`row-${i}`} banners={row} />
      ))}
    </div>
  );
}
