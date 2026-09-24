import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductImageGallery } from "@/components/products/ProductImageGallery";
import { ProductInfo } from "@/components/products/ProductInfo";
import { ProductDetailsSections } from "@/components/products/ProductDetailsSections";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { RecentlyViewed, TrackRecentlyViewed } from "@/components/products/RecentlyViewed";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import {
  getProduct,
  getProducts,
  getProductReviews,
  getProductQuestions,
} from "@/lib/api/products";
import { getStore } from "@/lib/api/store";
import { generatePageMetadata } from "@/lib/utils/metadata";
import { productSchema, breadcrumbSchema } from "@/lib/utils/structured-data";
import { getServerT } from "@/lib/i18n/server";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  // Pre-rendering is best effort: without API env/connectivity at build time,
  // pages render on demand (dynamicParams = true).
  if (!process.env.NEXT_PUBLIC_API_BASE_URL) return [];
  try {
    const { data } = await getProducts({ per_page: 100 });
    return data.map((p) => ({ slug: p.slug }));
  } catch (err) {
    console.warn("generateStaticParams(products): skipping pre-render", err);
    return [];
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    return generatePageMetadata({
      title: product.meta?.title || product.name,
      description: product.meta?.description || product.short_description,
      image: product.image,
      url: `/products/${slug}`,
      type: "product",
      keywords: product.meta?.keywords,
    });
  } catch {
    return {};
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  let product, store, reviews, questions;
  try {
    [product, store, reviews, questions] = await Promise.all([
      getProduct(slug),
      getStore(),
      getProductReviews(slug).catch(() => []),
      getProductQuestions(slug).catch(() => []),
    ]);
  } catch {
    notFound();
  }

  const galleryImages = [
    { url: product.image, id: 0 },
    ...product.images,
    ...(product.video_id && product.video_provider
      ? [
          {
            url: product.image, // poster
            id: -1,
            kind: "video" as const,
            provider: product.video_provider,
            videoId: product.video_id,
          },
        ]
      : []),
  ];

  const t = await getServerT();
  const breadcrumbItems = [
    { name: t("home", "Home"), url: "/" },
    { name: t("products", "Products"), url: "/products" },
    ...[product.category, product.sub_category, product.child_category]
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .map((c) => ({
        name: c.name,
        url: `/products?category=${encodeURIComponent(c.slug)}`,
      })),
    { name: product.name, url: `/products/${product.slug}` },
  ];

  return (
    <>
    <div className="product-page max-w-7xl mx-auto pb-16 max-md:pb-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: productSchema(product, store.currency),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbSchema(breadcrumbItems) }}
      />
      <TrackRecentlyViewed product={product} />

      {store.theme.page.breadcrumbs && (
        <div className="pf-breadcrumb max-md:hidden">
          <Breadcrumb items={[{ label: t("home", "Home"), href: "/" }, { label: product.name }]} />
        </div>
      )}

      <div className="pt-[42px] max-md:pt-0">
        <ProductInfo
          product={product}
          currency={store.currency_symbol}
          gallery={<ProductImageGallery images={galleryImages} productName={product.name} />}
        >
          <ProductDetailsSections
            product={product}
            store={store}
            reviews={reviews}
            questions={questions}
          />
        </ProductInfo>
      </div>

      <Suspense fallback={null}>
        <RelatedProducts
          categorySlug={product.category.slug}
          excludeSlug={slug}
          currency={store.currency_symbol}
        />
      </Suspense>
    </div>
    <RecentlyViewed currency={store.currency_symbol} excludeId={product.id} />
    </>
  );
}
