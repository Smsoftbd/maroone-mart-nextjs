import "server-only";

import { apiRequest, CACHE_TAGS, REVALIDATE, resolveL10n } from "./client";
import type { LocalizedString } from "./client";
import type {
  Category,
  Brand,
  Barcode,
  Product,
  ProductListParams,
  PaginatedResponse,
  ProductFiltersData,
  FlashSale,
  Review,
  Question,
} from "./types";

type L = LocalizedString | string;

type ApiCategory = Omit<Category, "name" | "children"> & {
  name: L;
  children: ApiCategory[];
};

interface ApiVariant {
  attribute_id: number;
  attribute_name: string;
  value_id: number;
  value: string | null;
  value_code: string | null;
}

interface ApiBarcode extends Omit<Barcode, "attributes"> {
  variants?: ApiVariant[];
  attributes?: Barcode["attributes"];
}

type ApiCategoryRef = { id: number; name: L; slug: string };

type ApiProduct = Omit<Product, "name" | "short_description" | "description" | "category" | "sub_category" | "child_category" | "barcodes" | "brand" | "unit"> & {
  name: L;
  short_description: L;
  description: L;
  category: ApiCategoryRef;
  sub_category?: ApiCategoryRef | null;
  child_category?: ApiCategoryRef | null;
  barcodes: ApiBarcode[];
  brand?: { id: number; name: L; image?: string | null } | null;
  unit?: { id: number; name: L };
};

type ApiFlashSale = Omit<FlashSale, "title" | "products"> & {
  title: L;
  products: ApiProduct[];
};

function resolveCategory(c: ApiCategory): Category {
  return {
    ...c,
    name: resolveL10n(c.name),
    children: c.children?.map(resolveCategory) ?? [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveAttr(a: any) {
  return { ...a, name: resolveL10n(a.name), value: resolveL10n(a.value) };
}

function resolveCatRef(c: ApiCategoryRef | null | undefined) {
  return c ? { ...c, name: resolveL10n(c.name) } : c ?? null;
}

function resolveProduct(p: ApiProduct): Product {
  return {
    ...p,
    name: resolveL10n(p.name),
    short_description: resolveL10n(p.short_description),
    description: resolveL10n(p.description),
    category: { ...p.category, name: resolveL10n(p.category.name) },
    sub_category: resolveCatRef(p.sub_category),
    child_category: resolveCatRef(p.child_category),
    brand: p.brand ? { ...p.brand, name: resolveL10n(p.brand.name) } : p.brand,
    unit: p.unit ? { ...p.unit, name: resolveL10n(p.unit.name) } : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    specifications: Array.isArray(p.specifications) ? p.specifications.map((s: any) => ({ label: resolveL10n(s.label), value: resolveL10n(s.value) })) : [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tags: Array.isArray(p.tags) ? p.tags.map((t: any) => resolveL10n(t)) : [],
    barcodes: Array.isArray(p.barcodes)
      ? p.barcodes.map((b: ApiBarcode) => ({
          ...b,
          attributes: Array.isArray(b.variants)
            ? b.variants.map((v) => ({
                name: v.attribute_name,
                // API may omit value/value_code; fall back to value_id so
                // each option stays uniquely identifiable & selectable.
                value: v.value ?? v.value_code ?? String(v.value_id),
                value_code: v.value_code ?? undefined,
                value_id: v.value_id,
              }))
            : Array.isArray(b.attributes)
            ? b.attributes.map(resolveAttr)
            : [],
        }))
      : [],
  };
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== ""
  );
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

export async function getCategories(lang?: string): Promise<Category[]> {
  const q = lang ? `?lang=${lang}` : "";
  const res = await apiRequest<{ data: ApiCategory[] }>(`/categories${q}`, {
    revalidate: REVALIDATE.CATEGORIES,
    tags: CACHE_TAGS.CATEGORIES,
  });
  return res.data.map(resolveCategory);
}

export async function getCategory(slug: string, lang?: string): Promise<Category> {
  const q = lang ? `?lang=${lang}` : "";
  const res = await apiRequest<{ data: ApiCategory }>(`/categories/${slug}${q}`, {
    revalidate: REVALIDATE.CATEGORIES,
    tags: CACHE_TAGS.CATEGORIES,
  });
  return resolveCategory(res.data);
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
  const joinList = (v?: (number | string)[]) =>
    v && v.length ? v.join(",") : undefined;

  const q = buildQuery({
    search: params.search,
    // `categories` (multi) takes precedence over the single `category`.
    category: joinList(params.categories) ?? params.category,
    brand: params.brand,
    brands: joinList(params.brands),
    attribute_values: joinList(params.attribute_values),
    price_min: params.price_min,
    price_max: params.price_max,
    sort: params.sort,
    featured: params.featured,
    lang: params.lang,
    per_page: params.per_page ?? 20,
    page: params.page ?? 1,
  });
  const res = await apiRequest<PaginatedResponse<ApiProduct>>(`/products${q}`, {
    revalidate: REVALIDATE.PRODUCTS_LIST,
    tags: CACHE_TAGS.PRODUCTS,
  });
  return { ...res, data: res.data.map(resolveProduct) };
}

export async function getProductFilters(lang?: string): Promise<ProductFiltersData> {
  const q = lang ? `?lang=${lang}` : "";
  try {
    const res = await apiRequest<{ data: ProductFiltersData }>(`/product-filters${q}`, {
      revalidate: REVALIDATE.CATEGORIES,
      tags: CACHE_TAGS.CATEGORIES,
    });
    return res.data;
  } catch {
    return { attributes: [], price_range: { min: 0, max: 0 } };
  }
}

export async function getProduct(slug: string, lang?: string): Promise<Product> {
  const q = lang ? `?lang=${lang}` : "";
  const res = await apiRequest<{ data: ApiProduct }>(`/products/${slug}${q}`, {
    revalidate: REVALIDATE.PRODUCT_DETAIL,
    tags: CACHE_TAGS.PRODUCT(slug),
  });
  return resolveProduct(res.data);
}

export async function getFeaturedProducts(lang?: string): Promise<Product[]> {
  const q = lang ? `?lang=${lang}` : "";
  try {
    const res = await apiRequest<{ data: ApiProduct[] }>(`/featured-products${q}`, {
      revalidate: REVALIDATE.PRODUCTS_LIST,
      tags: CACHE_TAGS.PRODUCTS,
    });
    return (res.data ?? []).map(resolveProduct);
  } catch {
    return [];
  }
}

export async function getFlashSales(lang?: string): Promise<FlashSale[]> {
  const q = lang ? `?lang=${lang}` : "";
  const res = await apiRequest<{ data: ApiFlashSale[] }>(`/flash-sales${q}`, {
    revalidate: REVALIDATE.FLASH_SALES,
    tags: CACHE_TAGS.FLASH_SALES,
  });
  return res.data.map((s) => ({ ...s, title: resolveL10n(s.title), products: s.products.map(resolveProduct) }));
}

export async function getNewArrivals(
  limit = 20,
  lang?: string
): Promise<Product[]> {
  const q = buildQuery({ limit, lang });
  const res = await apiRequest<{ data: ApiProduct[] }>(`/new-arrivals${q}`, {
    revalidate: REVALIDATE.PRODUCTS_LIST,
    tags: CACHE_TAGS.PRODUCTS,
  });
  return res.data.map(resolveProduct);
}

export async function getTopSelling(
  limit = 20,
  lang?: string
): Promise<Product[]> {
  const q = buildQuery({ limit, lang });
  const res = await apiRequest<{ data: ApiProduct[] }>(`/top-selling${q}`, {
    revalidate: REVALIDATE.PRODUCTS_LIST,
    tags: CACHE_TAGS.PRODUCTS,
  });
  return res.data.map(resolveProduct);
}

/**
 * Best-selling products = /top-selling, ordered by sales. When the store has no
 * sales history yet the endpoint returns nothing, so fall back to a random slice
 * of the catalog to keep the homepage section populated.
 */
export async function getBestSelling(
  limit = 20,
  lang?: string
): Promise<Product[]> {
  const top = await getTopSelling(limit, lang);
  if (top.length > 0) return top;

  const { data } = await getProducts({ per_page: Math.max(limit * 2, 24), lang });
  // Fisher–Yates shuffle so the fallback isn't always the same first products.
  for (let i = data.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [data[i], data[j]] = [data[j], data[i]];
  }
  return data.slice(0, limit);
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
