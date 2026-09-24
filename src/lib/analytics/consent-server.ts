import "server-only";

import {
  CONSENT_COOKIE,
  GRANTED,
  parseConsent,
  type Consent,
  type ConsentBannerMode,
} from "./consent";

/**
 * Consent env:
 * - GTM_CONSENT_DEFAULT          "granted" (default) or "denied"
 * - GTM_CONSENT_DENIED_REGIONS   e.g. "EEA" or "GB,CH,US-CA" — denied by default there
 * - CONSENT_BANNER               "off" (default) | "required" (only visitors whose
 *                                default is denied) | "all"
 * - GEO_COUNTRY_HEADER           optional request header with the visitor's ISO
 *                                country (else Cloudflare/Vercel/CloudFront/x-country-code)
 */

const EEA_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  "IS", "LI", "NO", "GB", "CH",
];

export type ConsentState = "granted" | "denied";
export type ConsentConfig = { default: ConsentState; deniedRegions: string[] };

type HeaderReader = { get(name: string): string | null };
type CookieReader = { get(name: string): { value: string } | undefined };

export function getConsentConfig(): ConsentConfig {
  const def: ConsentState =
    process.env.GTM_CONSENT_DEFAULT?.trim().toLowerCase() === "denied" ? "denied" : "granted";
  const deniedRegions = (process.env.GTM_CONSENT_DENIED_REGIONS ?? "")
    .split(",")
    .map((r) => r.trim().toUpperCase())
    .flatMap((r) => (r === "EEA" ? EEA_REGIONS : [r]))
    .filter((r) => /^[A-Z]{2}(-[A-Z0-9]{1,3})?$/.test(r));
  return { default: def, deniedRegions: [...new Set(deniedRegions)] };
}

export function getConsentBannerMode(): ConsentBannerMode {
  const v = process.env.CONSENT_BANNER?.trim().toLowerCase();
  return v === "all" || v === "required" ? v : "off";
}

const COUNTRY_HEADERS = ["cf-ipcountry", "x-vercel-ip-country", "cloudfront-viewer-country", "x-country-code"];

export function getVisitorCountry(headers: HeaderReader): string | null {
  const names = [process.env.GEO_COUNTRY_HEADER?.trim().toLowerCase(), ...COUNTRY_HEADERS];
  for (const name of names) {
    const v = name && headers.get(name)?.trim().toUpperCase();
    if (v && /^[A-Z]{2}$/.test(v) && v !== "XX") return v;
  }
  return null;
}

/**
 * This visitor's consent before they choose. Region rules need a country
 * header (nginx GeoIP, Cloudflare, …); without one the global default applies.
 * Google tags still apply GTM_CONSENT_DENIED_REGIONS themselves via Consent Mode.
 */
export function getDefaultConsent(headers: HeaderReader): Consent {
  const config = getConsentConfig();
  const country = getVisitorCountry(headers);
  const denied =
    config.default === "denied" || (!!country && config.deniedRegions.includes(country));
  return denied ? { analytics: false, marketing: false } : GRANTED;
}

/** Stored choice, else the visitor's default. */
export function resolveConsent(headers: HeaderReader, cookies: CookieReader): Consent {
  return parseConsent(cookies.get(CONSENT_COOKIE)?.value) ?? getDefaultConsent(headers);
}
