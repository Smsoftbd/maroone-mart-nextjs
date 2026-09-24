/**
 * Visitor consent, shared by the banner, the head snippets and the server
 * senders. Stored in a first-party cookie readable on both sides:
 * `sm_consent=a1.m0` (a = analytics, m = marketing/ads incl. Meta).
 */

export const CONSENT_COOKIE = "sm_consent";
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;
/** Dispatched on window to reopen the banner (footer "Cookie settings"). */
export const CONSENT_OPEN_EVENT = "sm:consent-open";

export type Consent = { analytics: boolean; marketing: boolean };
export type ConsentBannerMode = "off" | "required" | "all";

export const GRANTED: Consent = { analytics: true, marketing: true };

export function parseConsent(v: string | null | undefined): Consent | null {
  const m = v?.match(/^a([01])\.m([01])$/);
  return m ? { analytics: m[1] === "1", marketing: m[2] === "1" } : null;
}

export const serializeConsent = (c: Consent) =>
  `a${c.analytics ? 1 : 0}.m${c.marketing ? 1 : 0}`;

/** Google Consent Mode v2 signals for a consent state. */
export function gtagConsent(c: Consent) {
  const ad = c.marketing ? "granted" : "denied";
  return {
    analytics_storage: c.analytics ? "granted" : "denied",
    ad_storage: ad,
    ad_user_data: ad,
    ad_personalization: ad,
  };
}

/** Inline-script source: regex that reads the cookie before any bundle loads. */
export const CONSENT_COOKIE_JS_RE = `/(?:^|; )${CONSENT_COOKIE}=a([01])\\.m([01])/`;
