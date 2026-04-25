import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductImageGallery } from "@/components/products/ProductImageGallery";
import { ProductInfo } from "@/components/products/ProductInfo";
import { ProductTabs } from "@/components/products/ProductTabs";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { getProduct, getProductReviews, getProductQuestions, getProducts } from "@/lib/api/products";
import { getStore } from "@/lib/api/store";
import { generatePageMetadata } from "@/lib/utils/metadata";
import { productSchema, breadcrumbSchema } from "@/lib/utils/structured-data";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const { data } = await getProducts({ per_page: 100 });
  return data.map((p) => ({ slug: p.slug }));
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
      keywords: product.tags,
    });
  } catch {
    return {};
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  let product, reviews, questions, store;
  try {
    [product, reviews, questions, store] = await Promise.all([
      getProduct(slug),
      getProductReviews(slug),
      getProductQuestions(slug),
      getStore(),
    ]);
  } catch {
    notFound();
  }

  const galleryImages = [
    { url: product.image, id: 0 },
    ...product.images,
  ];

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: product.category.name, url: `/categories/${product.category.slug}` },
    { name: product.name, url: `/products/${product.slug}` },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: productSchema(product, store.currency_symbol),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbSchema(breadcrumbItems) }}
      />

      <Breadcrumb
        items={breadcrumbItems.map((i) => ({ label: i.name, href: i.url }))}
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        <ProductImageGallery images={galleryImages} productName={product.name} />
        <ProductInfo product={product} currency={store.currency_symbol} />
      </div>

      <ProductTabs product={product} reviews={reviews} questions={questions} />

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
