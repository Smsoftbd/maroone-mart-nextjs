"use server";

import { getProduct, getProducts } from "@/lib/api/products";
import type { Product, ProductListParams } from "@/lib/api/types";

const ids = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 50) : [];
const str = (v: unknown) => (typeof v === "string" && v.length <= 200 ? v : undefined);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/**
 * Next page of the shop listing for layout.pagination = load_more | infinite.
 * Inputs come from the browser, so only the listing filters are passed on.
 */
export async function loadProductsPage(
  query: Pick<ProductListParams, "categories" | "brands" | "attribute_values" | "search" | "sort" | "price_min" | "price_max">,
  page: number,
  perPage: number
): Promise<{ products: Product[]; lastPage: number }> {
  const { data, meta } = await getProducts({
    categories: ids(query.categories),
    brands: ids(query.brands),
    attribute_values: ids(query.attribute_values),
    search: str(query.search),
    sort: str(query.sort),
    price_min: num(query.price_min),
    price_max: num(query.price_max),
    page: Math.max(1, Math.floor(num(page) ?? 1)),
    per_page: Math.min(40, Math.max(1, Math.floor(num(perPage) ?? 20))),
  });
  return { products: data, lastPage: meta.last_page };
}

/**
 * Full product for the card quick view: the list endpoint omits images, the
 * short description and per-variant attributes. Null when it can't be loaded.
 */
export async function loadQuickViewProduct(slug: string): Promise<Product | null> {
  const s = str(slug);
  if (!s || /[/?#\\\s]/.test(s)) return null;
  try {
    return await getProduct(s);
  } catch {
    return null;
  }
}
