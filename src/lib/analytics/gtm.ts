/**
 * Browser-side Google Tag Manager tracking. Pushes GA4-shaped ecommerce
 * events to window.dataLayer; tags (GA4, Ads, …) and the optional
 * server-side container are configured in GTM itself.
 */

import { META_CURRENCY, purchaseEventId, type MetaUserData } from "./meta-shared";
import type { MetaItem } from "./meta";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

const isEnabled = () => typeof window !== "undefined" && Array.isArray(window.dataLayer);

export function pushDataLayer(data: Record<string, unknown>) {
  if (!isEnabled()) return;
  window.dataLayer!.push(data);
}

function newEventId(prefix: string) {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}.${rand}`;
}

export function trackGtm(event: string, params: Record<string, unknown> = {}, eventId?: string) {
  pushDataLayer({ event, event_id: eventId ?? newEventId(event), ...params });
}

/**
 * GA4 user-provided data (enhanced conversions) from the Meta match keys.
 * null clears it, e.g. on logout.
 */
export function setGtmUserData(ud: MetaUserData | null) {
  if (!ud || Object.keys(ud).length === 0) {
    pushDataLayer({ user_data: null, user_id: null });
    return;
  }
  const address = {
    first_name: ud.fn,
    last_name: ud.ln,
    city: ud.ct,
    region: ud.st,
    postal_code: ud.zp,
    country: ud.country,
  };
  const hasAddress = Object.values(address).some(Boolean);
  pushDataLayer({
    user_data: {
      ...(ud.em && { email: ud.em }),
      ...(ud.ph && { phone_number: `+${ud.ph}` }),
      ...(hasAddress && { address }),
    },
    user_id: ud.external_id ?? null,
  });
}

// ─── GA4 ecommerce events ────────────────────────────────────────────────────

const round = (n: number) => Math.round(n * 100) / 100;

function ecommerce(items: MetaItem[], value?: number) {
  return {
    currency: META_CURRENCY,
    value: round(value ?? items.reduce((s, i) => s + i.price * i.quantity, 0)),
    items: items.map((i) => ({
      item_id: String(i.id),
      ...(i.name && { item_name: i.name }),
      ...(i.category && { item_category: i.category }),
      price: i.price,
      quantity: i.quantity,
    })),
  };
}

function trackEcommerce(
  event: string,
  data: Record<string, unknown>,
  eventId?: string
) {
  // Clear the previous ecommerce object so GTM's merged data model doesn't leak items.
  pushDataLayer({ ecommerce: null });
  trackGtm(event, { ecommerce: data }, eventId);
}

export const gtmEvents = {
  pageView: () =>
    trackGtm("page_view", {
      page_location: window.location.href,
      page_path: window.location.pathname + window.location.search,
      page_title: document.title,
    }),
  viewItem: (item: MetaItem) => trackEcommerce("view_item", ecommerce([item])),
  addToCart: (item: MetaItem) => trackEcommerce("add_to_cart", ecommerce([item])),
  addToWishlist: (item: MetaItem) => trackEcommerce("add_to_wishlist", ecommerce([item])),
  beginCheckout: (items: MetaItem[], value: number) =>
    trackEcommerce("begin_checkout", ecommerce(items, value)),
  addPaymentInfo: (items: MetaItem[], value: number) =>
    trackEcommerce("add_payment_info", ecommerce(items, value)),
  purchase: (items: MetaItem[], value: number, orderId: number | string, invoice?: string) =>
    trackEcommerce(
      "purchase",
      { ...ecommerce(items, value), transaction_id: invoice || String(orderId) },
      purchaseEventId(orderId)
    ),
  search: (query: string) => trackGtm("search", { search_term: query }),
  signUp: () => trackGtm("sign_up"),
  generateLead: (source: "newsletter" | "contact") => trackGtm("generate_lead", { lead_source: source }),
};
