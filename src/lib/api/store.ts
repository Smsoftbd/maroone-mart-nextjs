import "server-only";

import { apiRequest, CACHE_TAGS, REVALIDATE, resolveL10n } from "./client";
import type { LocalizedString } from "./client";
import { getLocale } from "@/lib/i18n/locale";
import { normalizeColors, type StoreColors } from "@/lib/utils/colors";
import { normalizeHomepageSections, normalizeTheme } from "@/lib/utils/theme";
import type {
  Store,
  StoreLanguage,
  HeroBanner,
  Slider,
  Popup,
  HomepageCategory,
  AuthMode,
} from "./types";

type ApiStore = {
  languages?: StoreLanguage[];
  default_lang?: string;
  store_name: LocalizedString;
  email: string;
  phone: string;
  addresses: string[];
  country?: string | null;
  motto: LocalizedString;
  offer_message: LocalizedString;
  short_description: LocalizedString;
  logo: string;
  footer_logo: string;
  favicon: string;
  guest_checkout: boolean;
  auth_mode?: AuthMode;
  checkout_otp?: boolean;
  social: {
    facebook?: string | null;
    instagram?: string | null;
    youtube?: string | null;
    whatsapp?: string | null;
    tiktok?: string | null;
    pinterest?: string | null;
    twitter?: string | null;
    linkedin?: string | null;
  };
  colors?: Partial<Record<keyof StoreColors, string | null>> | null;
  theme?: unknown;
  theme_css?: string | null;
  theme_fonts_url?: string | null;
  theme_attributes?: unknown;
  homepage_sections?: unknown;
  sections: {
    featured_products: boolean;
    flash_sale: boolean;
    categories: boolean;
    new_arrivals: boolean;
    top_selling: boolean;
    reviews: boolean;
    newsletter: boolean;
    banner: boolean;
    wishlist?: boolean;
    loyalty?: boolean;
    appointments?: boolean;
    blog?: boolean;
  };
  seo: {
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | string[] | null;
  };
  scripts: {
    header: string | null;
    footer: string | null;
  };
  tracking?: {
    fb_pixel_id?: string | null;
    fb_domain_verification_id?: string | null;
    // Only returned for secret-key requests.
    fb_access_token?: string | null;
    fb_test_event_code?: string | null;
  };
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export async function getStore(): Promise<Store> {
  const lang = await getLocale();
  const res = await apiRequest<ApiStore>("/store", {
    revalidate: REVALIDATE.STORE,
    tags: CACHE_TAGS.STORE,
  });
  return {
    languages: res.languages ?? [],
    default_lang: res.default_lang ?? "en",
    name: resolveL10n(res.store_name, lang),
    logo: res.logo ?? "",
    footer_logo: res.footer_logo ?? res.logo ?? "",
    favicon: res.favicon ?? "",
    tagline: stripHtml(resolveL10n(res.motto, lang)),
    offer_message: resolveL10n(res.offer_message, lang) || resolveL10n(res.motto, lang),
    email: res.email ?? "",
    phone: res.phone ?? "",
    address: res.addresses?.[0] ?? "",
    country: res.country ?? "",
    currency: "BDT",
    currency_symbol: "৳",
    guest_checkout: res.guest_checkout ?? true,
    auth_mode: res.auth_mode ?? "email_password",
    checkout_otp: res.checkout_otp ?? false,
    social: {
      facebook: res.social?.facebook ?? undefined,
      instagram: res.social?.instagram ?? undefined,
      youtube: res.social?.youtube ?? undefined,
      twitter: res.social?.twitter ?? undefined,
      linkedin: res.social?.linkedin ?? undefined,
      whatsapp: res.social?.whatsapp ?? undefined,
      tiktok: res.social?.tiktok ?? undefined,
      pinterest: res.social?.pinterest ?? undefined,
    },
    colors: normalizeColors(res.colors),
    ...normalizeTheme(res.theme, res.theme_css, res.theme_fonts_url, res.theme_attributes),
    homepage_sections: normalizeHomepageSections(
      res.homepage_sections,
      res.sections,
      lang,
      res.default_lang ?? "en"
    ),
    features: {
      wishlist: res.sections?.wishlist ?? false,
      reviews: res.sections?.reviews ?? false,
      loyalty: res.sections?.loyalty ?? false,
      appointments: res.sections?.appointments ?? false,
      blog: res.sections?.blog ?? false,
    },
    sections: {
      featured_products: res.sections?.featured_products ?? true,
      flash_sale: res.sections?.flash_sale ?? true,
      categories: res.sections?.categories ?? true,
      new_arrivals: res.sections?.new_arrivals ?? true,
      top_selling: res.sections?.top_selling ?? true,
      reviews: res.sections?.reviews ?? true,
      newsletter: res.sections?.newsletter ?? true,
      banner: res.sections?.banner ?? true,
    },
    seo: {
      meta_title: res.seo?.meta_title ?? null,
      meta_description: res.seo?.meta_description ?? null,
      meta_keywords: res.seo?.meta_keywords ?? null,
    },
    scripts: {
      header: res.scripts?.header ?? null,
      footer: res.scripts?.footer ?? null,
    },
    tracking: {
      fb_pixel_id: process.env.META_PIXEL_ID || res.tracking?.fb_pixel_id || null,
      fb_domain_verification_id: res.tracking?.fb_domain_verification_id ?? null,
    },
  };
}

export type MetaCapiConfig = {
  pixelId: string;
  accessToken: string;
  testEventCode: string | null;
};

/**
 * Server-side Conversions API credentials. Env vars win over the admin
 * tracking settings; the access token is only returned for secret-key calls.
 */
export async function getMetaCapiConfig(): Promise<MetaCapiConfig | null> {
  let tracking: ApiStore["tracking"];
  try {
    // Distinct URL keeps this secret-key response in its own fetch-cache entry,
    // so the token can never be served to the public getStore() path.
    const res = await apiRequest<ApiStore>("/store?scope=server", {
      keyType: "secret",
      revalidate: REVALIDATE.STORE,
      tags: CACHE_TAGS.STORE,
    });
    tracking = res.tracking;
  } catch {
    tracking = undefined;
  }
  const pixelId = process.env.META_PIXEL_ID || tracking?.fb_pixel_id;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN || tracking?.fb_access_token;
  if (!pixelId || !accessToken) return null;
  return {
    pixelId,
    accessToken,
    testEventCode: process.env.META_TEST_EVENT_CODE || tracking?.fb_test_event_code || null,
  };
}

export async function getTranslations(
  lang?: string
): Promise<Record<string, string>> {
  const code = lang ?? (await getLocale());
  try {
    const res = await apiRequest<Record<string, string> | { data: Record<string, string> }>(
      `/translations?lang=${encodeURIComponent(code)}`,
      {
        revalidate: REVALIDATE.TRANSLATIONS,
      }
    );
    // Endpoint may return the map directly or wrapped in { data }.
    const dict = res && typeof res === "object" && "data" in res ? res.data : res;
    // An empty map is serialized by the backend as `[]`.
    return dict && typeof dict === "object" && !Array.isArray(dict) ? (dict as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export async function getHeroBanners(): Promise<HeroBanner[]> {
  const lang = await getLocale();
  const res = await apiRequest<{ data: Array<Omit<HeroBanner, "title" | "subtitle"> & { title: LocalizedString | string; subtitle?: LocalizedString | string }> }>("/hero-banners", {
    revalidate: REVALIDATE.BANNERS,
    tags: CACHE_TAGS.BANNERS,
  });
  return res.data.map((b) => ({ ...b, title: resolveL10n(b.title, lang), subtitle: b.subtitle ? resolveL10n(b.subtitle, lang) : undefined }));
}

export async function getSliders(): Promise<Slider[]> {
  const res = await apiRequest<{ data: Slider[] }>("/sliders", {
    revalidate: REVALIDATE.BANNERS,
  });
  return res.data;
}

export async function getPopups(): Promise<Popup[]> {
  const res = await apiRequest<{ data: Popup[] }>("/popups", {
    revalidate: 300,
  });
  return res.data;
}

export async function getHomepageCategories(
  lang?: string
): Promise<HomepageCategory[]> {
  const params = lang ? `?lang=${lang}` : "";
  const res = await apiRequest<{
    data: Array<{
      id: number;
      sort_order: number;
      image: string | null;
      category: { id: number; name: LocalizedString | string; slug: string; image: string | null };
    }>;
  }>(
    `/homepage-categories${params}`,
    {
      revalidate: REVALIDATE.CATEGORIES,
      tags: CACHE_TAGS.CATEGORIES,
    }
  );
  return res.data.map((c) => ({
    id: c.id,
    name: resolveL10n(c.category.name),
    slug: c.category.slug,
    image: c.image ?? c.category.image,
  }));
}
