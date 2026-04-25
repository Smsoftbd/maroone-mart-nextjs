import "server-only";

import { apiRequest, CACHE_TAGS, REVALIDATE } from "./client";
import type {
  Store,
  HeroBanner,
  Slider,
  Popup,
  HomepageCategory,
} from "./types";

type LocalizedString = { en: string; [lang: string]: string };

type ApiStore = {
  store_name: LocalizedString;
  email: string;
  phone: string;
  addresses: string[];
  motto: LocalizedString;
  short_description: LocalizedString;
  logo: string;
  favicon: string;
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
  colors: {
    primary: string;
    primary_text: string;
    secondary: string;
    secondary_text: string;
  };
  sections: {
    featured_products: boolean;
    flash_sale: boolean;
    categories: boolean;
    new_arrivals: boolean;
    top_selling: boolean;
    reviews: boolean;
    newsletter: boolean;
    wishlist?: boolean;
    loyalty?: boolean;
    appointments?: boolean;
    blog?: boolean;
  };
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export async function getStore(): Promise<Store> {
  const res = await apiRequest<ApiStore>("/store", {
    revalidate: REVALIDATE.STORE,
    tags: CACHE_TAGS.STORE,
  });
  return {
    name: res.store_name?.en ?? "",
    logo: res.logo ?? "",
    favicon: res.favicon ?? "",
    tagline: stripHtml(res.motto?.en ?? res.short_description?.en ?? ""),
    email: res.email ?? "",
    phone: res.phone ?? "",
    address: res.addresses?.[0] ?? "",
    currency: "BDT",
    currency_symbol: "৳",
    social: {
      facebook: res.social?.facebook ?? undefined,
      instagram: res.social?.instagram ?? undefined,
      youtube: res.social?.youtube ?? undefined,
      twitter: res.social?.twitter ?? undefined,
      linkedin: res.social?.linkedin ?? undefined,
    },
    colors: {
      primary: res.colors?.primary ?? "#000000",
      secondary: res.colors?.secondary ?? "#000000",
    },
    features: {
      wishlist: res.sections?.wishlist ?? false,
      reviews: res.sections?.reviews ?? false,
      loyalty: res.sections?.loyalty ?? false,
      appointments: res.sections?.appointments ?? false,
      blog: res.sections?.blog ?? false,
    },
  };
}

export async function getTranslations(
  lang: string
): Promise<Record<string, string>> {
  const res = await apiRequest<Record<string, string>>(
    `/translations?lang=${lang}`,
    {
      revalidate: REVALIDATE.TRANSLATIONS,
    }
  );
  return res;
}

export async function getHeroBanners(): Promise<HeroBanner[]> {
  const res = await apiRequest<{ data: HeroBanner[] }>("/hero-banners", {
    revalidate: REVALIDATE.BANNERS,
    tags: CACHE_TAGS.BANNERS,
  });
  return res.data;
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
  const res = await apiRequest<{ data: HomepageCategory[] }>(
    `/homepage-categories${params}`,
    {
      revalidate: REVALIDATE.CATEGORIES,
      tags: CACHE_TAGS.CATEGORIES,
    }
  );
  return res.data;
}
