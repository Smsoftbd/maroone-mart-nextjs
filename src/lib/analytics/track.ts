/**
 * Single entry point for storefront tracking: fans each event out to the
 * Meta Pixel/CAPI relay and to the GTM dataLayer. Each side no-ops when its
 * tag isn't configured.
 */

import { getMetaUserData, metaEvents, setMetaUserData, type MetaItem } from "./meta";
import type { MetaUserData } from "./meta-shared";
import { gtmEvents, setGtmUserData } from "./gtm";

/** Merge newly learned customer info (login, checkout form, …) into both match-key stores. */
export function setTrackingUserData(next: MetaUserData) {
  setMetaUserData(next);
  setGtmUserData(getMetaUserData());
}

export const track = {
  viewContent: (item: MetaItem) => {
    metaEvents.viewContent(item);
    gtmEvents.viewItem(item);
  },
  addToCart: (item: MetaItem) => {
    metaEvents.addToCart(item);
    gtmEvents.addToCart(item);
  },
  addToWishlist: (item: MetaItem) => {
    metaEvents.addToWishlist(item);
    gtmEvents.addToWishlist(item);
  },
  initiateCheckout: (items: MetaItem[], value: number) => {
    metaEvents.initiateCheckout(items, value);
    gtmEvents.beginCheckout(items, value);
  },
  addPaymentInfo: (items: MetaItem[], value: number) => {
    metaEvents.addPaymentInfo(items, value);
    gtmEvents.addPaymentInfo(items, value);
  },
  purchase: (items: MetaItem[], value: number, orderId: number | string, invoice?: string) => {
    metaEvents.purchase(items, value, orderId, invoice);
    gtmEvents.purchase(items, value, orderId, invoice);
  },
  completeRegistration: () => {
    metaEvents.completeRegistration();
    gtmEvents.signUp();
  },
  contact: () => {
    metaEvents.contact();
    gtmEvents.generateLead("contact");
  },
  lead: () => {
    metaEvents.lead();
    gtmEvents.generateLead("newsletter");
  },
};

// ─── Deferred (online gateway) purchases ─────────────────────────────────────

const pendingKey = (orderId: number | string) => `pending_purchase_${orderId}`;

type PendingPurchase = {
  items: MetaItem[];
  value: number;
  orderId: number | string;
  invoice?: string;
};

/**
 * Gateway orders aren't purchases until paid: park the browser half in this
 * tab (sessionStorage survives the round trip to the gateway) for
 * trackDeferredPurchase on the payment result page.
 */
export function deferPurchase(items: MetaItem[], value: number, orderId: number | string, invoice?: string) {
  try {
    sessionStorage.setItem(
      pendingKey(orderId),
      JSON.stringify({ items, value, orderId, invoice } satisfies PendingPurchase)
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
  track.purchase(pending.items, pending.value, pending.orderId, pending.invoice);
}
