import "server-only";

import { after, type NextRequest, type NextResponse } from "next/server";
import { getMetaCapiConfig } from "@/lib/api/store";
import { getMetaRequestContext, sendMetaEvents } from "./meta-capi";
import { META_CURRENCY, purchaseEventId, type MetaUserData } from "./meta-shared";
import { readGaIds, sendGa4Purchase } from "./ga4-mp";
import { getGa4MpConfig } from "./gtm-config";

/**
 * Server half of Purchase for Meta CAPI and GA4 (Measurement Protocol, via
 * server-side GTM when configured). Cash orders send it when the order is
 * placed; gateway orders park it in a cookie at order time and send it from
 * the gateway's success callback once payment is validated.
 */

export type PurchaseItem = { id: string; qty: number; price: number };

export type ServerPurchase = {
  orderId: number;
  invoice?: string;
  value: number;
  items: PurchaseItem[];
  /** Normalized, unhashed match keys (hashed at send time). */
  userData: MetaUserData;
  sourceUrl?: string;
  fbp?: string;
  fbc?: string;
  gaClientId?: string;
  gaSessionId?: string;
};

type ClientInfo = { ip?: string; userAgent?: string };

/** Adds the browser's tracking ids (Meta _fbp/_fbc, GA _ga) from this request. */
export function withBrowserIds(
  req: NextRequest,
  p: Omit<ServerPurchase, "fbp" | "fbc" | "gaClientId" | "gaSessionId">
): ServerPurchase {
  const meta = getMetaRequestContext(req, p.sourceUrl);
  const ga = readGaIds(req.cookies, getGa4MpConfig()?.measurementId);
  return {
    ...p,
    // Minted fbp (Pixel blocked) isn't persisted anywhere — don't send a one-off id.
    fbp: meta.newFbp ? undefined : meta.fbp,
    fbc: meta.fbc,
    gaClientId: ga.clientId,
    gaSessionId: ga.sessionId,
  };
}

function clientInfo(req: NextRequest): ClientInfo {
  const { ip, userAgent } = getMetaRequestContext(req);
  return { ip, userAgent };
}

async function send(p: ServerPurchase, client: ClientInfo, { ga4 }: { ga4: boolean }) {
  const eventId = purchaseEventId(p.orderId);
  const transactionId = p.invoice || String(p.orderId);
  const numItems = p.items.reduce((n, i) => n + i.qty, 0);

  const meta = getMetaCapiConfig().then(
    (config) =>
      config &&
      sendMetaEvents(
        config,
        [
          {
            event_name: "Purchase",
            event_id: eventId,
            event_source_url: p.sourceUrl,
            user_data: p.userData,
            custom_data: {
              value: p.value,
              currency: META_CURRENCY,
              content_type: "product",
              content_ids: p.items.map((i) => i.id),
              contents: p.items.map((i) => ({ id: i.id, quantity: i.qty, item_price: i.price })),
              ...(numItems > 0 && { num_items: numItems }),
              order_id: transactionId,
            },
          },
        ],
        { ...client, fbp: p.fbp, fbc: p.fbc }
      )
  );

  const ga4Config = ga4 ? getGa4MpConfig() : null;
  const ga = ga4Config
    ? sendGa4Purchase(ga4Config, {
        ids: { clientId: p.gaClientId, sessionId: p.gaSessionId },
        userId: p.userData.external_id,
        ...client,
        userData: p.userData,
        eventId,
        transactionId,
        value: p.value,
        currency: META_CURRENCY,
        items: p.items.map((i) => ({ item_id: i.id, quantity: i.qty, price: i.price })),
      })
    : null;

  await Promise.allSettled([meta, ga]);
}

/** Send now (after the response), e.g. for cash-on-delivery orders. */
export function trackServerPurchase(req: NextRequest, p: ServerPurchase) {
  const client = clientInfo(req);
  after(() => send(p, client, { ga4: true }));
}

// ─── Deferred (online gateway) purchases ─────────────────────────────────────

const cookieName = (orderId: number) => `sm_purchase_${orderId}`;
const COOKIE_PATH = "/api/payment";
const COOKIE_MAX_BYTES = 3800;

// SameSite=None: SSLCommerz returns via a cross-site POST, which drops Lax cookies.
const cookieOptions = {
  path: COOKIE_PATH,
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
};

const encode = (p: ServerPurchase) => Buffer.from(JSON.stringify(p)).toString("base64url");

/** Parks the purchase until the gateway confirms payment (see trackPaidPurchase). */
export function deferServerPurchase(res: NextResponse, p: ServerPurchase) {
  let value = encode(p);
  // Keep the cookie under the browser limit; value stays the full order total.
  for (let items = p.items; value.length > COOKIE_MAX_BYTES && items.length > 0; ) {
    items = items.slice(0, -1);
    value = encode({ ...p, items });
  }
  if (value.length > COOKIE_MAX_BYTES) return;
  res.cookies.set(cookieName(p.orderId), value, { ...cookieOptions, maxAge: 60 * 60 * 24 });
}

function readDeferred(req: NextRequest, orderId: number): ServerPurchase | null {
  const raw = req.cookies.get(cookieName(orderId))?.value;
  if (!raw) return null;
  try {
    const p = JSON.parse(Buffer.from(raw, "base64url").toString()) as ServerPurchase;
    return p.orderId === orderId && typeof p.value === "number" ? p : null;
  } catch {
    return null;
  }
}

/**
 * Call from a gateway success callback after payment is validated. Uses the
 * parked purchase when this browser still has it (and clears it). Without it,
 * only Meta gets a minimal Purchase — safe because Meta dedupes on event_id,
 * while GA4 could double count a repeated callback.
 */
export function trackPaidPurchase(
  req: NextRequest,
  res: NextResponse,
  orderId: number,
  paidAmount: number
) {
  if (!Number.isFinite(orderId) || orderId <= 0) return;
  const parked = readDeferred(req, orderId);
  if (parked) res.cookies.set(cookieName(orderId), "", { ...cookieOptions, maxAge: 0 });

  const p =
    parked ??
    withBrowserIds(req, { orderId, value: Number(paidAmount) || 0, items: [], userData: {} });
  const client = clientInfo(req);
  after(() => send(p, client, { ga4: !!parked }));
}
