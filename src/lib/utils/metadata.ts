import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export function generatePageMetadata({
  title,
  description,
  image,
  url,
  type = "website",
  keywords,
}: {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  keywords?: string[];
}): Metadata {
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const ogImage = image || `${SITE_URL}/og-default.jpg`;

  return {
    title,
    description,
    keywords: keywords?.join(", "),
    alternates: { canonical: fullUrl },
    openGraph: {
      title,
      description,
      url: fullUrl,
      type: type === "product" ? "website" : type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
