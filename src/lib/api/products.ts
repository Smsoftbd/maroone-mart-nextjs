import "server-only";

import { apiRequest, CACHE_TAGS, REVALIDATE } from "./client";
import type {
  Category,
  Brand,
  Product,
  ProductListParams,
  PaginatedResponse,
  FlashSale,
  Review,
  Question,
} from "./types";

function buildQuery(params: Record<string, string | number | undefined>) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== ""
  );
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

export async function getCategories(lang?: string): Promise<Category[]> {
  const q = lang ? `?lang=${lang}` : "";
  const res = await apiRequest<{ data: Category[] }>(`/categories${q}`, {
    revalidate: REVALIDATE.CATEGORIES,
    tags: CACHE_TAGS.CATEGORIES,
  });
  return res.data;
}

export async function getCategory(slug: string, lang?: string): Promise<Category> {
  const q = lang ? `?lang=${lang}` : "";
  const res = await apiRequest<{ data: Category }>(`/categories/${slug}${q}`, {
    revalidate: REVALIDATE.CATEGORIES,
    tags: CACHE_TAGS.CATEGORIES,
  });
  return res.data;
}

export async function getBrands(): Promise<Brand[]> {
  const res = await apiRequest<{ data: Brand[] }>("/brands", {
    revalidate: REVALIDATE.CATEGORIES,
  });
  return res.data;
}

export async function getProducts(
  params: ProductListParams = {}
): Promise<PaginatedResponse<Product>> {
  const q = buildQuery({
    search: params.search,
    category: params.category,
    brand: params.brand,
    featured: params.featured,
    lang: params.lang,
    per_page: params.per_page ?? 20,
    page: params.page ?? 1,
  });
  return apiRequest<PaginatedResponse<Product>>(`/products${q}`, {
    revalidate: REVALIDATE.PRODUCTS_LIST,
    tags: CACHE_TAGS.PRODUCTS,
  });
}

export async function getProduct(slug: string, lang?: string): Promise<Product> {
  const q = lang ? `?lang=${lang}` : "";
  const res = await apiRequest<{ data: Product }>(`/products/${slug}${q}`, {
    revalidate: REVALIDATE.PRODUCT_DETAIL,
    tags: CACHE_TAGS.PRODUCT(slug),
  });
  return res.data;
}

export async function getFeaturedProducts(lang?: string): Promise<Product[]> {
  const q = lang ? `?lang=${lang}` : "";
  try {
    const res = await apiRequest<{ data: Product[] }>(`/featured-products${q}`, {
      revalidate: REVALIDATE.PRODUCTS_LIST,
      tags: CACHE_TAGS.PRODUCTS,
    });
    return res.data ?? [];
  } catch {
    return [];
  }
}

export async function getFlashSales(lang?: string): Promise<FlashSale[]> {
  const q = lang ? `?lang=${lang}` : "";
  const res = await apiRequest<{ data: FlashSale[] }>(`/flash-sales${q}`, {
    revalidate: REVALIDATE.FLASH_SALES,
    tags: CACHE_TAGS.FLASH_SALES,
  });
  return res.data;
}

export async function getNewArrivals(
  limit = 20,
  lang?: string
): Promise<Product[]> {
  const q = buildQuery({ limit, lang });
  const res = await apiRequest<{ data: Product[] }>(`/new-arrivals${q}`, {
    revalidate: REVALIDATE.PRODUCTS_LIST,
    tags: CACHE_TAGS.PRODUCTS,
  });
  return res.data;
}

export async function getTopSelling(
  limit = 20,
  lang?: string
): Promise<Product[]> {
  const q = buildQuery({ limit, lang });
  const res = await apiRequest<{ data: Product[] }>(`/top-selling${q}`, {
    revalidate: REVALIDATE.PRODUCTS_LIST,
    tags: CACHE_TAGS.PRODUCTS,
  });
  return res.data;
}

export async function getProductReviews(slug: string): Promise<Review[]> {
  const res = await apiRequest<{ data: Review[] }>(
    `/products/${slug}/reviews`,
    {
      revalidate: REVALIDATE.PRODUCT_DETAIL,
      tags: CACHE_TAGS.REVIEWS(slug),
    }
  );
  return res.data;
}

export async function getProductQuestions(slug: string): Promise<Question[]> {
  const res = await apiRequest<{ data: Question[] }>(
    `/products/${slug}/questions`,
    {
      revalidate: REVALIDATE.PRODUCT_DETAIL,
      tags: CACHE_TAGS.PRODUCT(slug),
    }
  );
  return res.data;
}
