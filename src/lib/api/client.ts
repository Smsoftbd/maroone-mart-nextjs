import "server-only";

import type { ApiErrorShape } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_API_KEY!;
const SECRET_KEY = process.env.API_SECRET_KEY!;

export const REVALIDATE = {
  STORE: 3600,
  CATEGORIES: 1800,
  PRODUCTS_LIST: 300,
  PRODUCT_DETAIL: 300,
  BANNERS: 600,
  BLOG: 3600,
  FLASH_SALES: 60,
  TRANSLATIONS: 86400,
  FAQS: 3600,
  PAGES: 3600,
} as const;

export const CACHE_TAGS = {
  STORE: ["store"],
  CATEGORIES: ["categories"],
  PRODUCTS: ["products"],
  PRODUCT: (slug: string) => [`product-${slug}`],
  REVIEWS: (slug: string) => [`reviews-${slug}`],
  BANNERS: ["banners"],
  BLOG: ["blog"],
  BLOG_POST: (slug: string) => [`blog-${slug}`],
  FLASH_SALES: ["flash-sales"],
  CONTENT: ["content"],
} as const;

export type ApiOptions = {
  keyType?: "public" | "secret";
  bearerToken?: string;
  cartToken?: string;
  cache?: RequestCache;
  revalidate?: number | false;
  tags?: readonly string[];
  body?: unknown;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
};

export class ApiError extends Error implements ApiErrorShape {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const {
    keyType = "public",
    bearerToken,
    cartToken,
    cache,
    revalidate,
    tags,
    body,
    method = body ? "POST" : "GET",
  } = options;

  const headers: Record<string, string> = {
    "X-Api-Key": keyType === "secret" ? SECRET_KEY : PUBLIC_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (bearerToken) headers["Authorization"] = `Bearer ${bearerToken}`;
  if (cartToken) headers["X-Cart-Token"] = cartToken;

  const nextOptions: { revalidate?: number | false; tags?: string[] } = {};
  if (revalidate !== undefined) nextOptions.revalidate = revalidate;
  if (tags) nextOptions.tags = [...tags];

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache,
    next: nextOptions,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      error.message || error.error || "Request failed",
      error.errors
    );
  }

  return res.json();
}
