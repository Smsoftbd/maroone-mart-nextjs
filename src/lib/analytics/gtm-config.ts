import "server-only";

/**
 * Google Tag Manager / GA4 settings, all from env:
 *
 * - GTM_ID                      web container id (GTM-XXXX); empty disables GTM
 * - GTM_SERVER_URL              optional server-side GTM origin; serves gtm.js
 *                               first-party and receives server-side purchases
 * - GA4_MEASUREMENT_ID          G-XXXX, for server-side purchases (Measurement Protocol)
 * - GA4_API_SECRET              Measurement Protocol API secret
 * - GTM_CONSENT_DEFAULT         "granted" (default) or "denied"
 * - GTM_CONSENT_DENIED_REGIONS  optional, e.g. "EEA" or "GB,CH,US-CA" — denied by
 *                               default there until a consent banner updates it
 */

const GOOGLE_TAG_ORIGIN = "https://www.googletagmanager.com";
const GOOGLE_ANALYTICS_ORIGIN = "https://www.google-analytics.com";

const EEA_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  "IS", "LI", "NO", "GB", "CH",
];

export type ConsentState = "granted" | "denied";

export type GtmConfig = {
  id: string;
  /** Where gtm.js / ns.html are loaded from. */
  origin: string;
  consent: { default: ConsentState; deniedRegions: string[] };
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

function getConsentConfig(): GtmConfig["consent"] {
  const def: ConsentState =
    process.env.GTM_CONSENT_DEFAULT?.trim().toLowerCase() === "denied" ? "denied" : "granted";
  const deniedRegions = (process.env.GTM_CONSENT_DENIED_REGIONS ?? "")
    .split(",")
    .map((r) => r.trim().toUpperCase())
    .flatMap((r) => (r === "EEA" ? EEA_REGIONS : [r]))
    .filter((r) => /^[A-Z]{2}(-[A-Z0-9]{1,3})?$/.test(r));
  return { default: def, deniedRegions: [...new Set(deniedRegions)] };
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
