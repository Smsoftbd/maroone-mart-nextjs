/**
 * Meta Pixel / Conversions API helpers shared by the browser tracker and the
 * server-side CAPI sender. No secrets here — safe for client bundles.
 */

// Matches `currency` in getStore(); Meta needs the ISO code, not the symbol.
export const META_CURRENCY = "BDT";

/** localStorage key holding normalized match keys; read by the inline Pixel init. */
export const META_USER_DATA_KEY = "meta_ud";

/** Events the browser may relay to CAPI. Purchase is sent from /api/orders only. */
export const META_CLIENT_EVENTS = [
  "PageView",
  "ViewContent",
  "Search",
  "AddToCart",
  "AddToWishlist",
  "InitiateCheckout",
  "AddPaymentInfo",
  "CompleteRegistration",
  "Contact",
  "Lead",
] as const;

/** Shared by /api/orders (CAPI) and the browser Pixel so Meta dedupes the pair. */
export const purchaseEventId = (orderId: number | string) => `purchase.${orderId}`;

export type MetaClientEvent = (typeof META_CLIENT_EVENTS)[number];
export type MetaEventName = MetaClientEvent | "Purchase";

/**
 * Advanced-matching fields, already normalized per Meta's rules but NOT
 * hashed (fbq hashes them itself; the CAPI sender hashes server-side).
 */
export type MetaUserData = {
  em?: string;
  ph?: string;
  fn?: string;
  ln?: string;
  ct?: string;
  st?: string;
  zp?: string;
  country?: string;
  external_id?: string;
};

export type MetaContent = { id: string; quantity: number; item_price?: number };

export type MetaCustomData = {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_name?: string;
  content_category?: string;
  content_type?: "product" | "product_group";
  contents?: MetaContent[];
  num_items?: number;
  search_string?: string;
  order_id?: string;
  status?: string;
};

const clean = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();

/** Digits only, with country code. Local BD numbers (01XXXXXXXXX) get 880 prefixed. */
export function normalizeMetaPhone(phone: string | null | undefined): string | undefined {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^01[3-9]\d{8}$/.test(digits)) digits = `88${digits}`;
  return digits.length >= 8 ? digits : undefined;
}

/** ISO-3166 alpha-2, lowercase. Accepts a 2-letter code or a known country name. */
export function normalizeMetaCountry(country: string | null | undefined): string | undefined {
  const c = clean(country);
  if (/^[a-z]{2}$/.test(c)) return c;
  if (c === "bangladesh") return "bd";
  return undefined;
}

/** Build normalized match keys from whatever customer info is at hand. */
export function buildMetaUserData(input: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  id?: string | number | null;
}): MetaUserData {
  const parts = clean(input.name).split(/\s+/).filter(Boolean);
  const ud: MetaUserData = {
    em: clean(input.email) || undefined,
    ph: normalizeMetaPhone(input.phone),
    fn: parts[0],
    ln: parts.length > 1 ? parts[parts.length - 1] : undefined,
    ct: clean(input.city).replace(/[^a-z]/g, "") || undefined,
    st: clean(input.state).replace(/[^a-z]/g, "") || undefined,
    zp: clean(input.postal_code).replace(/\s/g, "") || undefined,
    country: normalizeMetaCountry(input.country),
    external_id: input.id != null && input.id !== "" ? String(input.id) : undefined,
  };
  for (const k of Object.keys(ud) as (keyof MetaUserData)[]) {
    if (!ud[k]) delete ud[k];
  }
  return ud;
}
