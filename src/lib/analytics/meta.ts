/**
 * Browser-side Meta tracking. Every event fires twice with one shared
 * event_id: fbq() in the browser and the /api/ev → Conversions API relay.
 * Meta deduplicates the pair, so blocked/partial Pixel loads still count and
 * each event carries hashed match keys (email, phone, name, …) for a higher
 * Event Match Quality score.
 */

import {
  META_CURRENCY,
  META_USER_DATA_KEY,
  purchaseEventId,
  type MetaClientEvent,
  type MetaCustomData,
  type MetaEventName,
  type MetaUserData,
} from "./meta-shared";

type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
    /** false when Meta CAPI runs in server-side GTM (META_VIA_SGTM) — skip the /api/ev relay. */
    smMetaRelay?: boolean;
  }
}

let userData: MetaUserData | null = null;

function loadUserData(): MetaUserData {
  if (userData) return userData;
  try {
    userData = JSON.parse(localStorage.getItem(META_USER_DATA_KEY) || "{}") as MetaUserData;
  } catch {
    userData = {};
  }
  return userData;
}

/** Current normalized (unhashed) match keys; also feeds GTM enhanced conversions. */
export const getMetaUserData = (): MetaUserData => ({ ...loadUserData() });

/** Merge newly learned customer info (login, checkout form, …) into the match keys. */
export function setMetaUserData(next: MetaUserData) {
  const merged = { ...loadUserData(), ...next };
  userData = merged;
  try {
    localStorage.setItem(META_USER_DATA_KEY, JSON.stringify(merged));
  } catch {
    // storage unavailable — keep in memory only
  }
}

export function clearMetaUserData() {
  userData = {};
  try {
    localStorage.removeItem(META_USER_DATA_KEY);
  } catch {
    // ignore
  }
}

const isEnabled = () => typeof window !== "undefined" && typeof window.fbq === "function";

export function newMetaEventId(prefix: string) {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}.${rand}`;
}

const lastShared = new Map<string, { key: string; id: string }>();

/**
 * One event id per prefix until its key changes, so the Meta and GTM route
 * listeners (separate components, same commit) tag the same page view alike
 * and server-side GTM can dedupe its Meta copy against the Pixel.
 */
export function sharedEventId(prefix: string, key: string) {
  const last = lastShared.get(prefix);
  if (last?.key === key) return last.id;
  const id = newMetaEventId(prefix);
  lastShared.set(prefix, { key, id });
  return id;
}

type TrackOptions = {
  eventId?: string;
  /** false when the server already sent this event to CAPI (Purchase). */
  relay?: boolean;
};

export function trackMeta(
  event: MetaEventName,
  customData: MetaCustomData = {},
  { eventId = newMetaEventId(event), relay = true }: TrackOptions = {}
) {
  if (!isEnabled()) return;

  window.fbq!("track", event, customData, { eventID: eventId });

  if (!relay || event === "Purchase" || window.smMetaRelay === false) return;
  const body = JSON.stringify({
    event_name: event as MetaClientEvent,
    event_id: eventId,
    event_source_url: window.location.href,
    user_data: loadUserData(),
    custom_data: customData,
  });
  // keepalive lets the request finish when the event precedes a navigation
  // (Buy Now → checkout, payment gateway redirect).
  fetch("/api/ev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

// ─── Typed helpers for the standard e-commerce events ────────────────────────

export type MetaItem = {
  id: number | string;
  name?: string;
  price: number;
  quantity: number;
  category?: string;
};

function itemsData(items: MetaItem[], value?: number): MetaCustomData {
  return {
    content_type: "product",
    content_ids: items.map((i) => String(i.id)),
    contents: items.map((i) => ({ id: String(i.id), quantity: i.quantity, item_price: i.price })),
    num_items: items.reduce((n, i) => n + i.quantity, 0),
    value: round(value ?? items.reduce((s, i) => s + i.price * i.quantity, 0)),
    currency: META_CURRENCY,
    ...(items.length === 1 && items[0].name && { content_name: items[0].name }),
    ...(items.length === 1 && items[0].category && { content_category: items[0].category }),
  };
}

const round = (n: number) => Math.round(n * 100) / 100;

// `eventId` lets the caller share one id with the GTM copy of the event.
export const metaEvents = {
  viewContent: (item: MetaItem, eventId?: string) =>
    trackMeta("ViewContent", itemsData([item]), { eventId }),
  addToCart: (item: MetaItem, eventId?: string) =>
    trackMeta("AddToCart", itemsData([item]), { eventId }),
  addToWishlist: (item: MetaItem, eventId?: string) =>
    trackMeta("AddToWishlist", itemsData([item]), { eventId }),
  initiateCheckout: (items: MetaItem[], value: number, eventId?: string) =>
    trackMeta("InitiateCheckout", itemsData(items, value), { eventId }),
  addPaymentInfo: (items: MetaItem[], value: number, eventId?: string) =>
    trackMeta("AddPaymentInfo", itemsData(items, value), { eventId }),
  /** Browser half only — /api/orders already sent the CAPI copy with this event id. */
  purchase: (items: MetaItem[], value: number, orderId: number | string, invoice?: string) =>
    trackMeta(
      "Purchase",
      { ...itemsData(items, value), order_id: invoice || String(orderId) },
      { eventId: purchaseEventId(orderId), relay: false }
    ),
  search: (query: string, eventId?: string) =>
    trackMeta("Search", { search_string: query }, { eventId }),
  completeRegistration: (eventId?: string) =>
    trackMeta("CompleteRegistration", { status: "completed" }, { eventId }),
  contact: (eventId?: string) => trackMeta("Contact", {}, { eventId }),
  lead: (eventId?: string) => trackMeta("Lead", {}, { eventId }),
};
