import type { Product, BlogPost, Store } from "@/lib/api/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export function productSchema(product: Product, currencySymbol: string): string {
  const price = Math.max((product.barcodes.find((b) => b.is_active) ?? product.barcodes[0])?.effective_price ?? 0, 0);
  const inStock = product.barcodes.some((b) => b.stock > 0);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description,
    image: [product.image, ...product.images.map((i) => i.url)],
    sku: product.sku,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand.name }
      : undefined,
    aggregateRating:
      product.rating_count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating_avg,
            reviewCount: product.rating_count,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: currencySymbol,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/products/${product.slug}`,
    },
  };
  return JSON.stringify(schema);
}

export function breadcrumbSchema(
  items: { name: string; url: string }[]
): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
  return JSON.stringify(schema);
}

export function articleSchema(post: BlogPost): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    image: post.featured_image,
    datePublished: post.published_at,
    author: post.author
      ? { "@type": "Person", name: post.author }
      : undefined,
    description: post.excerpt || post.meta_description,
  };
  return JSON.stringify(schema);
}

export function organizationSchema(store: Store): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.name,
    url: SITE_URL,
    logo: store.logo,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: store.phone,
      email: store.email,
      contactType: "customer service",
    },
    sameAs: Object.values(store.social).filter(Boolean),
  };
  return JSON.stringify(schema);
}

export function localBusinessSchema(store: Store): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: store.name,
    image: store.logo,
    telephone: store.phone,
    email: store.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: store.address,
    },
    url: SITE_URL,
  };
  return JSON.stringify(schema);
}

export function websiteSchema(store: Store): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: store.name,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  return JSON.stringify(schema);
}
