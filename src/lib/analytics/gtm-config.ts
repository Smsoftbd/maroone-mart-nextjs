import "server-only";

import { getConsentConfig, type ConsentConfig } from "./consent-server";

/**
 * Google Tag Manager / GA4 settings, all from env:
 *
 * - GTM_ID                      web container id (GTM-XXXX); empty disables GTM
 * - GTM_SERVER_URL              optional server-side GTM origin; serves gtm.js
 *                               first-party and receives server-side purchases
 * - GA4_MEASUREMENT_ID          G-XXXX, for server-side purchases (Measurement Protocol)
 * - GA4_API_SECRET              Measurement Protocol API secret
 * - META_VIA_SGTM               "true" once Meta CAPI runs as a tag in server-side
 *                               GTM: this app stops its own CAPI sends (Pixel stays)
 * - Consent Mode settings: see consent-server.ts
 */

export const isMetaViaSgtm = () => process.env.META_VIA_SGTM?.trim().toLowerCase() === "true";

const GOOGLE_TAG_ORIGIN = "https://www.googletagmanager.com";
const GOOGLE_ANALYTICS_ORIGIN = "https://www.google-analytics.com";

export type GtmConfig = {
  id: string;
  /** Where gtm.js / ns.html are loaded from. */
  origin: string;
  consent: ConsentConfig;
  /** GA4 purchases are sent server-side; the GA4 tag should skip the browser copy. */
  serverPurchase: boolean;
};

export type Ga4MpConfig = {
  measurementId: string;
  apiSecret: string;
  /** Full Measurement Protocol collect URL (server container or Google). */
  endpoint: string;
};

/** https server-side GTM origin (may include a path prefix), without trailing slash. */
function getServerOrigin(): string | null {
  const raw = process.env.GTM_SERVER_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    return (url.origin + url.pathname).replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export function getGa4MpConfig(): Ga4MpConfig | null {
  const measurementId = process.env.GA4_MEASUREMENT_ID?.trim();
  const apiSecret = process.env.GA4_API_SECRET?.trim();
  if (!measurementId || !/^G-[A-Z0-9]{4,16}$/.test(measurementId) || !apiSecret) return null;
  return {
    measurementId,
    apiSecret,
    endpoint: `${getServerOrigin() ?? GOOGLE_ANALYTICS_ORIGIN}/mp/collect`,
  };
}

/** Invalid values are ignored, never injected. */
export function getGtmConfig(): GtmConfig | null {
  const id = process.env.GTM_ID?.trim();
  if (!id || !/^GTM-[A-Z0-9]{4,12}$/.test(id)) return null;
  return {
    id,
    origin: getServerOrigin() ?? GOOGLE_TAG_ORIGIN,
    consent: getConsentConfig(),
    serverPurchase: getGa4MpConfig() !== null,
  };
}

/**
 * Removes the standard GTM container snippet for `id` from admin-supplied
 * header/footer JS, so a copy pasted in the admin panel doesn't load the
 * container twice (double page views and conversions).
 */
export function stripGtmSnippet(js: string | null, id: string | undefined): string | null {
  if (!js || !id) return js;
  const re = new RegExp(
    String.raw`\(function\(w,d,s,l,i\)\{(?:(?!\(function\(w,d,s,l,i\))[\s\S])*?\}\)\(\s*window\s*,\s*document\s*,\s*['"]script['"]\s*,\s*['"]dataLayer['"]\s*,\s*['"]` +
      id +
      String.raw`['"]\s*\)\s*;?`,
    "g"
  );
  const out = js.replace(re, "");
  return out.trim() ? out : null;
}
