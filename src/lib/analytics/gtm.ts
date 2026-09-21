/**
 * Browser-side Google Tag Manager tracking. Pushes GA4-shaped ecommerce
 * events to window.dataLayer; tags (GA4, Ads, …) and the optional
 * server-side container are configured in GTM itself.
 */

import { META_CURRENCY, purchaseEventId, type MetaUserData } from "./meta-shared";
import { newMetaEventId, type MetaItem } from "./meta";

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

export function trackGtm(event: string, params: Record<string, unknown> = {}, eventId?: string) {
  pushDataLayer({ event, event_id: eventId ?? newMetaEventId(event), ...params });
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

/** A product in a list (grid/carousel) or line; ids match the Meta catalog (barcode id). */
export type GtmItem = MetaItem & {
  index?: number;
  listId?: string;
  listName?: string;
};

export type ItemList = { id: string; name: string };

export type PurchaseExtras = { coupon?: string; shipping?: number; tax?: number };

const round = (n: number) => Math.round(n * 100) / 100;

const gaItem = (i: GtmItem) => ({
  item_id: String(i.id),
  ...(i.name && { item_name: i.name }),
  ...(i.category && { item_category: i.category }),
  ...(i.listId && { item_list_id: i.listId }),
  ...(i.listName && { item_list_name: i.listName }),
  ...(i.index !== undefined && { index: i.index }),
  price: i.price,
  quantity: i.quantity,
});

function ecommerce(items: GtmItem[], value?: number) {
  return {
    currency: META_CURRENCY,
    value: round(value ?? items.reduce((s, i) => s + i.price * i.quantity, 0)),
    items: items.map(gaItem),
  };
}

function trackEcommerce(event: string, data: Record<string, unknown>, eventId?: string) {
  // Clear the previous ecommerce object so GTM's merged data model doesn't leak items.
  pushDataLayer({ ecommerce: null });
  trackGtm(event, { ecommerce: data }, eventId);
}

export const gtmEvents = {
  pageView: (eventId?: string) =>
    trackGtm(
      "page_view",
      {
        page_location: window.location.href,
        page_path: window.location.pathname + window.location.search,
        page_title: document.title,
      },
      eventId
    ),
  viewItemList: (list: ItemList, items: GtmItem[]) =>
    trackEcommerce("view_item_list", {
      item_list_id: list.id,
      item_list_name: list.name,
      items: items.map(gaItem),
    }),
  selectItem: (list: ItemList, item: GtmItem) =>
    trackEcommerce("select_item", {
      item_list_id: list.id,
      item_list_name: list.name,
      items: [gaItem(item)],
    }),
  viewItem: (item: GtmItem, eventId?: string) =>
    trackEcommerce("view_item", ecommerce([item]), eventId),
  addToCart: (item: GtmItem, eventId?: string) =>
    trackEcommerce("add_to_cart", ecommerce([item]), eventId),
  removeFromCart: (item: GtmItem) => trackEcommerce("remove_from_cart", ecommerce([item])),
  viewCart: (items: GtmItem[], value: number) => trackEcommerce("view_cart", ecommerce(items, value)),
  addToWishlist: (item: GtmItem, eventId?: string) =>
    trackEcommerce("add_to_wishlist", ecommerce([item]), eventId),
  beginCheckout: (items: GtmItem[], value: number, eventId?: string) =>
    trackEcommerce("begin_checkout", ecommerce(items, value), eventId),
  addPaymentInfo: (items: GtmItem[], value: number, paymentType?: string, eventId?: string) =>
    trackEcommerce(
      "add_payment_info",
      { ...ecommerce(items, value), ...(paymentType && { payment_type: paymentType }) },
      eventId
    ),
  purchase: (
    items: GtmItem[],
    value: number,
    orderId: number | string,
    invoice?: string,
    extras: PurchaseExtras = {}
  ) =>
    trackEcommerce(
      "purchase",
      {
        ...ecommerce(items, value),
        transaction_id: invoice || String(orderId),
        ...(extras.coupon && { coupon: extras.coupon }),
        ...(extras.shipping !== undefined && { shipping: round(extras.shipping) }),
        ...(extras.tax !== undefined && { tax: round(extras.tax) }),
      },
      purchaseEventId(orderId)
    ),
  search: (query: string, eventId?: string) => trackGtm("search", { search_term: query }, eventId),
  login: (method: string) => trackGtm("login", { method }),
  signUp: (method: string, eventId?: string) => trackGtm("sign_up", { method }, eventId),
  generateLead: (source: "newsletter" | "contact", eventId?: string) =>
    trackGtm("generate_lead", { lead_source: source }, eventId),
};
