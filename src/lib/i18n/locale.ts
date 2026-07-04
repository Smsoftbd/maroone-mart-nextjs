import "server-only";

import { cookies } from "next/headers";

/** Cookie the storefront uses to remember the shopper's chosen language. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** Fallback language when the shopper hasn't picked one yet. */
export const DEFAULT_LOCALE = "en";

/** Locales that read right-to-left (used for <html dir>). */
export const RTL_LOCALES = new Set(["ar", "ur", "fa", "he"]);

/**
 * Current locale for this request, from the NEXT_LOCALE cookie.
 * Reading the cookie opts consuming routes into dynamic rendering.
 *
 * Falls back to DEFAULT_LOCALE when there is no request context — e.g. inside
 * `generateStaticParams`, which runs at build time and where `cookies()` throws.
 */
export async function getLocale(): Promise<string> {
  try {
    const store = await cookies();
    return store.get(LOCALE_COOKIE)?.value || DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function isRtl(locale: string): boolean {
  return RTL_LOCALES.has(locale);
}
