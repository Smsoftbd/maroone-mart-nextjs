import "server-only";

import { apiRequest, REVALIDATE, CACHE_TAGS, resolveL10n } from "./client";
import type { LocalizedString } from "./client";
import { getLocale } from "@/lib/i18n/locale";
import type {
  Faq,
  Outlet,
  PageSummary,
  Page,
  BlogPost,
  BlogCategory,
  BlogListParams,
  PaginatedResponse,
  DeliveryCharge,
  PaymentMethod,
} from "./types";

function buildQuery(params: Record<string, string | number | undefined>) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== ""
  );
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

export async function getFaqs(category?: string): Promise<Faq[]> {
  const q = category ? `?category=${category}` : "";
  const res = await apiRequest<{ data: Faq[] }>(`/faqs${q}`, {
    revalidate: REVALIDATE.FAQS,
    tags: CACHE_TAGS.CONTENT,
  });
  return res.data;
}

export async function getOutlets(): Promise<Outlet[]> {
  const res = await apiRequest<{ data: Outlet[] }>("/outlets", {
    revalidate: REVALIDATE.STORE,
    tags: CACHE_TAGS.CONTENT,
  });
  return res.data;
}

type ApiPageSummary = Omit<PageSummary, "title"> & { title: LocalizedString | string };
type ApiPage = Omit<Page, "title"> & { title: LocalizedString | string };

export async function getPages(): Promise<PageSummary[]> {
  const lang = await getLocale();
  const res = await apiRequest<{ data: ApiPageSummary[] }>("/pages", {
    revalidate: REVALIDATE.PAGES,
    tags: CACHE_TAGS.CONTENT,
  });
  return res.data.map((p) => ({ ...p, title: resolveL10n(p.title, lang) }));
}

export async function getPage(slug: string): Promise<Page> {
  const lang = await getLocale();
  const res = await apiRequest<{ data: ApiPage }>(`/pages/${slug}`, {
    revalidate: REVALIDATE.PAGES,
    tags: CACHE_TAGS.CONTENT,
  });
  return { ...res.data, title: resolveL10n(res.data.title, lang) };
}

export async function getBlogs(
  params: BlogListParams = {}
): Promise<PaginatedResponse<BlogPost>> {
  const q = buildQuery({
    category: params.category,
    tag: params.tag,
    per_page: params.per_page ?? 10,
    page: params.page ?? 1,
  });
  return apiRequest<PaginatedResponse<BlogPost>>(`/blogs${q}`, {
    revalidate: REVALIDATE.BLOG,
    tags: CACHE_TAGS.BLOG,
  });
}

export async function getBlog(slug: string): Promise<BlogPost> {
  const res = await apiRequest<{ data: BlogPost }>(`/blogs/${slug}`, {
    revalidate: REVALIDATE.BLOG,
    tags: CACHE_TAGS.BLOG_POST(slug),
  });
  return res.data;
}

export async function getBlogCategories(): Promise<BlogCategory[]> {
  const res = await apiRequest<{ data: BlogCategory[] }>("/blog-categories", {
    revalidate: REVALIDATE.BLOG,
    tags: CACHE_TAGS.BLOG,
  });
  return res.data;
}

export async function getDeliveryCharges(): Promise<DeliveryCharge[]> {
  const res = await apiRequest<{ data: DeliveryCharge[] }>(
    "/delivery-charges",
    { revalidate: 600 }
  );
  return res.data;
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const res = await apiRequest<{ data: PaymentMethod[] }>(
    "/payment-methods",
    { revalidate: 600 }
  );
  return res.data;
}
