import type { MetadataRoute } from "next";
import { getProducts, getCategories } from "@/lib/api/products";
import { getBlogs, getPages } from "@/lib/api/content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/flash-sale`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/track-order`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  const [products, categories, { data: blogs }, pages] = await Promise.all([
    getProducts({ per_page: 100 }).catch(() => ({ data: [] })),
    getCategories().catch(() => []),
    getBlogs({ per_page: 100 }).catch(() => ({ data: [] })),
    getPages().catch(() => []),
  ]);

  const productPages: MetadataRoute.Sitemap = (products as { data: { slug: string }[] }).data.map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = (categories as { slug: string }[]).map((c) => ({
    url: `${SITE_URL}/products?category=${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = (blogs as { slug: string }[]).map((b) => ({
    url: `${SITE_URL}/blog/${b.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const contentPages: MetadataRoute.Sitemap = (pages as { slug: string }[]).map((p) => ({
    url: `${SITE_URL}/pages/${p.slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...productPages,
    ...categoryPages,
    ...blogPages,
    ...contentPages,
  ];
}
