import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductImageGallery } from "@/components/products/ProductImageGallery";
import { ProductInfo } from "@/components/products/ProductInfo";
import { ProductDetailsSections } from "@/components/products/ProductDetailsSections";
import { RelatedProducts } from "@/components/products/RelatedProducts";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

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

  const shareUrl = `${SITE_URL}/products/${product.slug}`;

  return (
    <div className="product-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-8 md:pt-4 md:pb-16 lg:pt-6">
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

      {store.theme.page.breadcrumbs && (
      <div className="hidden md:block text-xs [&_ol]:text-xs [&_li:last-child]:max-w-[12rem] sm:[&_li:last-child]:max-w-xs [&_li:last-child_span]:truncate [&_li:last-child]:min-w-0">
        <Breadcrumb
          items={breadcrumbItems.map((i) => ({ label: i.name, href: i.url }))}
        />
      </div>
      )}

      <div className="md:mt-4">
        <ProductInfo
          product={product}
          currency={store.currency_symbol}
          shareUrl={shareUrl}
          phone={store.phone}
          questionCount={questions.length}
          whatsapp={store.social.whatsapp}
          facebook={store.social.facebook}
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
  );
}
