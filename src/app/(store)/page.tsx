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

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore();
  return generatePageMetadata({
    title: store.name,
    description: store.tagline,
    image: store.logo,
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

      <HeroBanner banners={heroBanners} />
      <CategoryGrid categories={categories} />
      {flashSales.length > 0 && (
        <FlashSaleBanner sales={flashSales} currency={currency} />
      )}
      <FeaturedProducts products={featured} currency={currency} />
      <NewArrivals products={newArrivals} currency={currency} />
      <TopSelling products={topSelling} currency={currency} />
      <NewsletterSection />
    </>
  );
}
