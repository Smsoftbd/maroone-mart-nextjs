/**
 * Single entry point for storefront tracking: fans each event out to the
 * Meta Pixel/CAPI relay and to the GTM dataLayer with one shared event id.
 * Each side no-ops when its tag isn't configured.
 */

import { getMetaUserData, metaEvents, newMetaEventId, setMetaUserData, type MetaItem } from "./meta";
import type { MetaUserData } from "./meta-shared";
import { gtmEvents, setGtmUserData, type GtmItem, type ItemList, type PurchaseExtras } from "./gtm";

export type { GtmItem as TrackItem, ItemList, PurchaseExtras };

/** Merge newly learned customer info (login, checkout form, …) into both match-key stores. */
export function setTrackingUserData(next: MetaUserData) {
  setMetaUserData(next);
  setGtmUserData(getMetaUserData());
}

export const track = {
  viewContent: (item: MetaItem) => {
    const id = newMetaEventId("ViewContent");
    metaEvents.viewContent(item, id);
    gtmEvents.viewItem(item, id);
  },
  addToCart: (item: MetaItem) => {
    const id = newMetaEventId("AddToCart");
    metaEvents.addToCart(item, id);
    gtmEvents.addToCart(item, id);
  },
  /** GA4 only — Meta has no standard event for these. */
  removeFromCart: (item: MetaItem) => gtmEvents.removeFromCart(item),
  viewCart: (items: MetaItem[], value: number) => gtmEvents.viewCart(items, value),
  viewItemList: (list: ItemList, items: GtmItem[]) => gtmEvents.viewItemList(list, items),
  selectItem: (list: ItemList, item: GtmItem) => gtmEvents.selectItem(list, item),
  login: (method: "email" | "otp") => gtmEvents.login(method),
  addToWishlist: (item: MetaItem) => {
    const id = newMetaEventId("AddToWishlist");
    metaEvents.addToWishlist(item, id);
    gtmEvents.addToWishlist(item, id);
  },
  initiateCheckout: (items: MetaItem[], value: number) => {
    const id = newMetaEventId("InitiateCheckout");
    metaEvents.initiateCheckout(items, value, id);
    gtmEvents.beginCheckout(items, value, id);
  },
  addPaymentInfo: (items: MetaItem[], value: number, paymentType?: string) => {
    const id = newMetaEventId("AddPaymentInfo");
    metaEvents.addPaymentInfo(items, value, id);
    gtmEvents.addPaymentInfo(items, value, paymentType, id);
  },
  purchase: (
    items: MetaItem[],
    value: number,
    orderId: number | string,
    invoice?: string,
    extras?: PurchaseExtras
  ) => {
    metaEvents.purchase(items, value, orderId, invoice);
    gtmEvents.purchase(items, value, orderId, invoice, extras);
  },
  completeRegistration: (method: "email" | "otp") => {
    const id = newMetaEventId("CompleteRegistration");
    metaEvents.completeRegistration(id);
    gtmEvents.signUp(method, id);
  },
  contact: () => {
    const id = newMetaEventId("Contact");
    metaEvents.contact(id);
    gtmEvents.generateLead("contact", id);
  },
  lead: () => {
    const id = newMetaEventId("Lead");
    metaEvents.lead(id);
    gtmEvents.generateLead("newsletter", id);
  },
};

// ─── Deferred (online gateway) purchases ─────────────────────────────────────

const pendingKey = (orderId: number | string) => `pending_purchase_${orderId}`;

type PendingPurchase = {
  items: MetaItem[];
  value: number;
  orderId: number | string;
  invoice?: string;
  extras?: PurchaseExtras;
};

/**
 * Gateway orders aren't purchases until paid: park the browser half in this
 * tab (sessionStorage survives the round trip to the gateway) for
 * trackDeferredPurchase on the payment result page.
 */
export function deferPurchase(
  items: MetaItem[],
  value: number,
  orderId: number | string,
  invoice?: string,
  extras?: PurchaseExtras
) {
  try {
    sessionStorage.setItem(
      pendingKey(orderId),
      JSON.stringify({ items, value, orderId, invoice, extras } satisfies PendingPurchase)
    );
  } catch {
    // storage unavailable — the server half still records the purchase
  }
}

/** Fires the parked purchase once (removed first, so reloads don't repeat it). */
export function trackDeferredPurchase(orderId: number | string) {
  let pending: PendingPurchase | null = null;
  try {
    const raw = sessionStorage.getItem(pendingKey(orderId));
    sessionStorage.removeItem(pendingKey(orderId));
    pending = raw ? (JSON.parse(raw) as PendingPurchase) : null;
  } catch {
    return;
  }
  if (!pending || String(pending.orderId) !== String(orderId)) return;
  track.purchase(pending.items, pending.value, pending.orderId, pending.invoice, pending.extras);
}
