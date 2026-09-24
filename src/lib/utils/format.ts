/** Taka reads as "Tk 1,050.00", like the reference storefront. */
export function formatPrice(
  amount: number,
  currencySymbol = "৳"
): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  const symbol = currencySymbol === "৳" ? "Tk " : currencySymbol;
  return `${symbol}${formatted}`;
}

export function formatDiscount(
  original: number,
  discounted: number
): string {
  if (original <= 0) return "0";
  const pct = ((original - discounted) / original) * 100;
  return String(Math.round(pct));
}

/** Map storefront language codes to BCP-47 tags for Intl formatting. */
const LOCALE_TO_INTL: Record<string, string> = {
  en: "en-US",
  bn: "bn-BD",
  ar: "ar",
  hi: "hi-IN",
  ur: "ur-PK",
  id: "id-ID",
  ms: "ms-MY",
  vi: "vi-VN",
  tr: "tr-TR",
  ru: "ru-RU",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  pt: "pt-BR",
  it: "it-IT",
  nl: "nl-NL",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
};

export function intlLocale(locale?: string): string {
  return (locale && LOCALE_TO_INTL[locale]) || "en-US";
}

export function formatDate(dateString: string, locale?: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(intlLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
