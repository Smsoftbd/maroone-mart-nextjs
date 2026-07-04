import type { Metadata } from "next";
import { Slider } from "@/components/home/Slider";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FlashSaleBanner } from "@/components/home/FlashSaleBanner";
import { FeaturedProducts, NewArrivals, BestSelling } from "@/components/home/FeaturedProducts";
import { CategoryProductSections } from "@/components/home/CategoryProductSections";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { getStore, getSliders, getHomepageCategories } from "@/lib/api/store";
import {
  getFeaturedProducts,
  getFlashSales,
  getNewArrivals,
  getBestSelling,
  getProducts,
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
  const [store, sliders, categories, featured, flashSales, newArrivals, bestSelling] =
    await Promise.all([
      getStore(),
      getSliders(),
      getHomepageCategories(),
      getFeaturedProducts(),
      getFlashSales(),
      getNewArrivals(12),
      getBestSelling(12),
    ]);

  const currency = store.currency_symbol;

  const categoryProducts = await Promise.all(
    categories.map(async (category) => {
      try {
        const { data } = await getProducts({
          category: category.slug,
          per_page: 8,
        });
        return { category, products: data };
      } catch {
        return { category, products: [] };
      }
    })
  );

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

      {store.sections.banner && <Slider sliders={sliders} />}
      {store.sections.categories && <CategoryGrid categories={categories} />}
      {store.sections.flash_sale && flashSales.length > 0 && (
        <FlashSaleBanner sales={flashSales} currency={currency} />
      )}
      {store.sections.top_selling && (
        <BestSelling products={bestSelling} currency={currency} />
      )}
      {store.sections.new_arrivals && (
        <NewArrivals products={newArrivals} currency={currency} />
      )}
      {store.sections.featured_products && (
        <FeaturedProducts products={featured} currency={currency} />
      )}
      {store.sections.categories && (
        <CategoryProductSections sections={categoryProducts} currency={currency} />
      )}
      {store.sections.newsletter && <NewsletterSection />}
    </>
  );
}
