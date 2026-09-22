import type { Metadata } from "next";
import { Slider } from "@/components/home/Slider";
import { FeatureHighlights } from "@/components/home/FeatureHighlights";
import { PopularCategories } from "@/components/home/PopularCategories";
import { FlashSaleBanner } from "@/components/home/FlashSaleBanner";
import { BestSelling } from "@/components/home/FeaturedProducts";
import { PromoBanners } from "@/components/home/PromoBanners";
import { AllProducts } from "@/components/home/AllProducts";
import { NewArrivalsList } from "@/components/home/NewArrivalsList";
import { VideoReviewBanner } from "@/components/home/VideoReviewBanner";
import { BrandsCarousel } from "@/components/home/BrandsCarousel";
import { getStore, getSliders, getHomepageCategories, getHeroBanners } from "@/lib/api/store";
import {
  getFlashSales,
  getNewArrivals,
  getBestSelling,
  getProducts,
  getBrands,
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
  const [store, sliders, categories, flashSales, newArrivals, bestSelling, banners, allProducts, brands] =
    await Promise.all([
      getStore(),
      getSliders(),
      getHomepageCategories(),
      getFlashSales(),
      getNewArrivals(12),
      getBestSelling(12),
      // Optional sections: a failing endpoint hides the section, not the page.
      getHeroBanners().catch(() => []),
      getProducts({ per_page: 20 }).catch(() => null),
      getBrands().catch(() => []),
    ]);

  const currency = store.currency_symbol;

  return (
    <div className="bg-slate-50/60">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: organizationSchema(store) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: websiteSchema(store) }}
      />

      <div className="bg-white">
        {store.sections.banner && <Slider sliders={sliders} />}
        <FeatureHighlights />
      </div>
      {store.sections.categories && <PopularCategories categories={categories} />}
      {store.sections.flash_sale && flashSales.length > 0 && (
        <FlashSaleBanner sales={flashSales} currency={currency} />
      )}
      {store.sections.top_selling && (
        <BestSelling products={bestSelling} currency={currency} />
      )}
      {store.sections.banner && <PromoBanners banners={banners} />}
      {allProducts && (
        <AllProducts
          products={allProducts.data}
          total={allProducts.meta.total}
          currency={currency}
        />
      )}
      {store.sections.new_arrivals && (
        <NewArrivalsList products={newArrivals} currency={currency} />
      )}
      {store.social.youtube && <VideoReviewBanner youtubeUrl={store.social.youtube} />}
      <BrandsCarousel brands={brands} />
    </div>
  );
}
