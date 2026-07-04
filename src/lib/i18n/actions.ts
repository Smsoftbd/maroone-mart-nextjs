"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "./locale";

/**
 * Persist the shopper's language choice in the NEXT_LOCALE cookie.
 * Called from the client language switcher; the client then refreshes so
 * server components re-fetch with the new ?lang.
 */
export async function setLocale(locale: string): Promise<void> {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
