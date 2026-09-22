import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Flame } from "lucide-react";
import { Slider } from "@/components/home/Slider";
import { FeatureHighlights } from "@/components/home/FeatureHighlights";
import { PopularCategories } from "@/components/home/PopularCategories";
import { FlashSaleBanner } from "@/components/home/FlashSaleBanner";
import { HomeProductSection } from "@/components/home/FeaturedProducts";
import { PromoBanners } from "@/components/home/PromoBanners";
import { AllProducts } from "@/components/home/AllProducts";
import { VideoReviewBanner } from "@/components/home/VideoReviewBanner";
import { BrandsCarousel } from "@/components/home/BrandsCarousel";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { SectionHeader } from "@/components/home/SectionHeader";
import { BlogCard } from "@/components/blog/BlogCard";
import { getStore, getSliders, getHomepageCategories, getHeroBanners } from "@/lib/api/store";
import {
  getFlashSales,
  getNewArrivals,
  getBestSelling,
  getFeaturedProducts,
  getProducts,
  getBrands,
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

/** Blocks after which the store's extra rows (promo banners, all products …) belong. */
const SHOP_KEYS = new Set(["banner", "categories", "flash_sale", "featured_products", "new_arrivals", "top_selling"]);
const PRODUCT_KEYS = new Set(["flash_sale", "featured_products", "new_arrivals", "top_selling"]);

/**
 * Homepage built from Appearance → Sections: enabled blocks in the owner's
 * order, with their titles, item counts, grid/slider layout and "View all"
 * switches. Only the data for enabled blocks is fetched.
 */
export default async function HomePage() {
  const [store, t] = await Promise.all([getStore(), getServerT()]);
  const sections = store.homepage_sections.filter((s) => s.enabled);
  const on = (key: string) => sections.find((s) => s.key === key);
  const limitOf = (key: string) => on(key)?.limit ?? 12;
  // Fetch only what an enabled block shows; a failing endpoint hides that block.
  const when = <T,>(key: string, load: () => Promise<T[]>): Promise<T[]> =>
    on(key) ? load().catch(() => []) : Promise.resolve([]);

  const [sliders, categories, flashSales, featured, newArrivals, bestSelling, blogs, banners, allProducts, brands] =
    await Promise.all([
      when("banner", getSliders),
      when("categories", () => getHomepageCategories()),
      when("flash_sale", () => getFlashSales()),
      when("featured_products", () => getFeaturedProducts()),
      when("new_arrivals", () => getNewArrivals(limitOf("new_arrivals"))),
      when("top_selling", () => getBestSelling(limitOf("top_selling"))),
      when("blog", async () => (store.features.blog ? (await getBlogs({ per_page: limitOf("blog") })).data : [])),
      when("banner", getHeroBanners),
      getProducts({ per_page: 20 }).catch(() => null),
      getBrands().catch(() => []),
    ]);

  const currency = store.currency_symbol;
  const { page } = store.theme;
  const viewAll = t("view_all", "View All");

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
        return (
          <PopularCategories
            key={s.key}
            categories={categories.slice(0, limit)}
            style={page.category_style}
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
        return (
          <HomeProductSection
            key={s.key}
            title={s.title || t("new_arrivals", "New Arrivals")}
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
            icon={<Flame className="h-5 w-5 fill-[var(--color-tertiary-ink)] text-[var(--color-tertiary-ink)]" />}
          />
        );
      case "blog":
        return blogs.length > 0 ? (
          <section key={s.key} className="home-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-reveal>
            <SectionHeader
              title={s.title || t("from_our_blog", "From our blog")}
              subtitle={s.subtitle}
              viewAllHref={s.view_all ? "/blog" : undefined}
              viewAllLabel={viewAll}
            />
            <div className="grid gap-[var(--layout-grid-gap,18px)] sm:grid-cols-2 lg:grid-cols-3">
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

  const lastShopIndex = sections.reduce((last, s, i) => (SHOP_KEYS.has(s.key) ? i : last), -1);
  const firstProductIndex = sections.findIndex((s) => PRODUCT_KEYS.has(s.key));

  const extras = (
    <>
      {allProducts && (
        <AllProducts products={allProducts.data} total={allProducts.meta.total} currency={currency} />
      )}
      {store.social.youtube && <VideoReviewBanner youtubeUrl={store.social.youtube} />}
      <BrandsCarousel brands={brands} />
    </>
  );

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: organizationSchema(store) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: websiteSchema(store) }}
      />

      {lastShopIndex < 0 && extras}
      {sections.map((s, i) => (
        <div key={s.key} className="contents">
          {render(s)}
          {i === firstProductIndex && on("banner") && <PromoBanners banners={banners} />}
          {i === lastShopIndex && extras}
        </div>
      ))}
    </div>
  );
}
