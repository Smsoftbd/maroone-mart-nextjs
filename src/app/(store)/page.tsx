import type { Metadata } from "next";
import { HeroBanner } from "@/components/home/HeroBanner";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FlashSaleBanner } from "@/components/home/FlashSaleBanner";
import { FeaturedProducts, NewArrivals, TopSelling } from "@/components/home/FeaturedProducts";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { getStore, getHeroBanners, getHomepageCategories } from "@/lib/api/store";
import {
  getFeaturedProducts,
  getFlashSales,
  getNewArrivals,
  getTopSelling,
} from "@/lib/api/products";
import { generatePageMetadata } from "@/lib/utils/metadata";
import { organizationSchema, websiteSchema } from "@/lib/utils/structured-data";

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

export default async function HomePage() {
  const [store, heroBanners, categories, featured, flashSales, newArrivals, topSelling] =
    await Promise.all([
      getStore(),
      getHeroBanners(),
      getHomepageCategories(),
      getFeaturedProducts(),
      getFlashSales(),
      getNewArrivals(12),
      getTopSelling(12),
    ]);

  const currency = store.currency_symbol;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: organizationSchema(store) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: websiteSchema(store) }}
      />

      {store.sections.banner && <HeroBanner banners={heroBanners} />}
      {store.sections.categories && <CategoryGrid categories={categories} />}
      {store.sections.flash_sale && flashSales.length > 0 && (
        <FlashSaleBanner sales={flashSales} currency={currency} />
      )}
      {store.sections.featured_products && (
        <FeaturedProducts products={featured} currency={currency} />
      )}
      {store.sections.new_arrivals && (
        <NewArrivals products={newArrivals} currency={currency} />
      )}
      {store.sections.top_selling && (
        <TopSelling products={topSelling} currency={currency} />
      )}
      {store.sections.newsletter && <NewsletterSection />}
    </>
  );
}
