"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n/I18nProvider";
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  CONSENT_OPEN_EVENT,
  gtagConsent,
  parseConsent,
  serializeConsent,
  type Consent,
  type ConsentBannerMode,
} from "@/lib/analytics/consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const CHANGE_EVENT = "sm:consent-change";

function readCookie(): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
  return m ? m[1] : null;
}

const subscribe = (cb: () => void) => {
  window.addEventListener(CHANGE_EVENT, cb);
  return () => window.removeEventListener(CHANGE_EVENT, cb);
};

function saveConsent(c: Consent) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${serializeConsent(c)}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
  window.gtag?.("consent", "update", gtagConsent(c));
  window.fbq?.("consent", c.marketing ? "grant" : "revoke");
  window.dataLayer?.push({
    event: "consent_update",
    consent_analytics: c.analytics,
    consent_marketing: c.marketing,
  });
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Cookie consent banner. Updates Google Consent Mode, the Meta Pixel and the
 * `sm_consent` cookie the server-side senders honour. Reopened from the
 * footer's "Cookie settings" link.
 */
export function ConsentBanner({
  mode,
  defaultConsent,
}: {
  mode: Exclude<ConsentBannerMode, "off">;
  defaultConsent: Consent;
}) {
  const t = useT();
  // Server snapshot "ssr": render nothing until the cookie can be read.
  const raw = useSyncExternalStore(subscribe, readCookie, () => "ssr");
  const stored = raw === "ssr" ? null : parseConsent(raw);
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [draft, setDraft] = useState<Consent>(defaultConsent);

  useEffect(() => {
    const onOpen = () => {
      setDraft(parseConsent(readCookie()) ?? defaultConsent);
      setCustomize(true);
      setOpen(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
  }, [defaultConsent]);

  const needsChoice =
    raw !== "ssr" &&
    !stored &&
    (mode === "all" || !defaultConsent.analytics || !defaultConsent.marketing);
  if (!open && !needsChoice) return null;

  const choose = (c: Consent) => {
    saveConsent(c);
    setOpen(false);
    setCustomize(false);
  };

  const toggle = (key: keyof Consent, label: string, hint: string) => (
    <label className="flex items-start gap-3 py-2 cursor-pointer">
      <input
        type="checkbox"
        checked={draft[key]}
        onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.checked }))}
        className="mt-1 h-4 w-4 accent-[var(--color-brand-500,currentColor)]"
      />
      <span>
        <span className="block font-medium text-[var(--color-text-primary)]">{label}</span>
        <span className="block text-xs text-[var(--color-text-secondary)]">{hint}</span>
      </span>
    </label>
  );

  const btn =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("cookie_consent_title", "Cookie preferences")}
      className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm shadow-xl sm:p-5">
        <p className="font-medium text-[var(--color-text-primary)]">
          {t("cookie_consent_title", "Cookie preferences")}
        </p>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          {t(
            "cookie_consent_text",
            "We use cookies to measure site traffic and improve our ads. Essential cookies (cart, sign-in) are always on."
          )}
        </p>

        {customize && (
          <div className="mt-3 divide-y divide-[var(--color-border)]">
            {toggle(
              "analytics",
              t("cookie_consent_analytics", "Analytics"),
              t("cookie_consent_analytics_hint", "Helps us understand how the store is used.")
            )}
            {toggle(
              "marketing",
              t("cookie_consent_marketing", "Marketing"),
              t("cookie_consent_marketing_hint", "Measures and personalises ads (Google, Meta).")
            )}
          </div>
        )}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {customize ? (
            <button
              type="button"
              onClick={() => choose(draft)}
              className={`${btn} border border-surface-900 text-surface-900 hover:bg-surface-100`}
            >
              {t("cookie_consent_save", "Save choices")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCustomize(true)}
              className={`${btn} text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]`}
            >
              {t("cookie_consent_customize", "Customize")}
            </button>
          )}
          <button
            type="button"
            onClick={() => choose({ analytics: false, marketing: false })}
            className={`${btn} border border-surface-900 text-surface-900 hover:bg-surface-100`}
          >
            {t("cookie_consent_reject", "Reject non-essential")}
          </button>
          <button
            type="button"
            onClick={() => choose({ analytics: true, marketing: true })}
            className={`${btn} bg-brand-500 text-white hover:bg-brand-600`}
          >
            {t("cookie_consent_accept", "Accept all")}
          </button>
        </div>
      </div>
    </div>
  );
}
