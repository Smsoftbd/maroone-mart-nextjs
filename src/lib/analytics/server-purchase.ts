import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { after, type NextRequest } from "next/server";
import { getMetaCapiConfig } from "@/lib/api/store";
import { getMetaRequestContext, sendMetaEvents } from "./meta-capi";
import { META_CURRENCY, purchaseEventId, type MetaUserData } from "./meta-shared";
import { readGaIds, sendGa4Purchase } from "./ga4-mp";
import { getGa4MpConfig, isMetaViaSgtm } from "./gtm-config";
import { resolveConsent } from "./consent-server";
import type { Consent } from "./consent";

/**
 * Server half of Purchase for Meta CAPI and GA4 (Measurement Protocol, via
 * server-side GTM when configured). Cash orders send it when the order is
 * placed. Gateway orders are parked on disk at order time and sent once the
 * gateway confirms payment — from the browser's success redirect or the
 * gateway's IPN, whichever arrives first (so a closed tab still counts).
 */

export type PurchaseItem = { id: string; name?: string; qty: number; price: number };

type ClientInfo = { ip?: string; userAgent?: string };

export type ServerPurchase = {
  orderId: number;
  invoice?: string;
  value: number;
  items: PurchaseItem[];
  coupon?: string;
  shipping?: number;
  tax?: number;
  /** Normalized, unhashed match keys (hashed at send time). */
  userData: MetaUserData;
  sourceUrl?: string;
  fbp?: string;
  fbc?: string;
  gaClientId?: string;
  gaSessionId?: string;
  consent: Consent;
  /** Shopper's IP/UA at order time — the IPN request comes from the gateway, not them. */
  client: ClientInfo;
};

type PurchaseInput = Omit<
  ServerPurchase,
  "fbp" | "fbc" | "gaClientId" | "gaSessionId" | "consent" | "client"
>;

/** Adds this request's browser context: tracking ids, consent, IP and UA. */
export function withBrowserContext(req: NextRequest, p: PurchaseInput): ServerPurchase {
  const meta = getMetaRequestContext(req, p.sourceUrl);
  const ga = readGaIds(req.cookies, getGa4MpConfig()?.measurementId);
  return {
    ...p,
    // Minted fbp (Pixel blocked) isn't persisted anywhere — don't send a one-off id.
    fbp: meta.newFbp ? undefined : meta.fbp,
    fbc: meta.fbc,
    gaClientId: ga.clientId,
    gaSessionId: ga.sessionId,
    consent: resolveConsent(req.headers, req.cookies),
    client: { ip: meta.ip, userAgent: meta.userAgent },
  };
}

async function send(p: ServerPurchase, { ga4 }: { ga4: boolean }) {
  const eventId = purchaseEventId(p.orderId);
  const transactionId = p.invoice || String(p.orderId);
  const numItems = p.items.reduce((n, i) => n + i.qty, 0);
  // Ads data only with marketing consent; server-side GTM sends Meta itself when enabled.
  const sendMeta = p.consent.marketing && !isMetaViaSgtm();

  const meta = sendMeta
    ? getMetaCapiConfig().then(
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
            { ...p.client, fbp: p.fbp, fbc: p.fbc }
          )
      )
    : null;

  const ga4Config = ga4 && p.consent.analytics ? getGa4MpConfig() : null;
  const ga = ga4Config
    ? sendGa4Purchase(ga4Config, {
        ids: { clientId: p.gaClientId, sessionId: p.gaSessionId },
        userId: p.userData.external_id,
        ...p.client,
        userData: p.consent.marketing ? p.userData : {},
        adConsent: p.consent.marketing,
        eventId,
        transactionId,
        value: p.value,
        currency: META_CURRENCY,
        coupon: p.coupon,
        shipping: p.shipping,
        tax: p.tax,
        items: p.items.map((i) => ({
          item_id: i.id,
          ...(i.name && { item_name: i.name }),
          quantity: i.qty,
          price: i.price,
        })),
      })
    : null;

  await Promise.allSettled([meta, ga]);
}

/** Send now (after the response), e.g. for cash-on-delivery orders. */
export function trackServerPurchase(p: ServerPurchase) {
  after(() => send(p, { ga4: true }));
}

// ─── Deferred (online gateway) purchases ─────────────────────────────────────
//
// One file per order: <id>.json (parked) → <id>.claimed (being sent) → <id>.sent.
// rename() is atomic, so when the success redirect and the IPN race, exactly
// one of them claims the purchase. Needs a writable, persistent directory
// shared by every app instance (TRACKING_DATA_DIR, default .data/ in the app).

// turbopackIgnore: runtime paths — keeps the build from tracing the whole project.
const STORE_DIR =
  process.env.TRACKING_DATA_DIR?.trim() ||
  path.join(/*turbopackIgnore: true*/ process.cwd(), ".data", "pending-purchases");
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const isOrderId = (id: number) => Number.isSafeInteger(id) && id > 0;
const file = (orderId: number, state: "json" | "claimed" | "sent") =>
  path.join(/*turbopackIgnore: true*/ STORE_DIR, `${orderId}.${state}`);

const exists = (p: string) => stat(/*turbopackIgnore: true*/ p).then(() => true, () => false);

/** Drop records older than a week (unpaid orders, or long since sent). */
async function sweep() {
  const now = Date.now();
  for (const name of await readdir(/*turbopackIgnore: true*/ STORE_DIR).catch(() => [] as string[])) {
    const p = path.join(/*turbopackIgnore: true*/ STORE_DIR, name);
    const s = await stat(/*turbopackIgnore: true*/ p).catch(() => null);
    if (s && now - s.mtimeMs > MAX_AGE_MS) await unlink(/*turbopackIgnore: true*/ p).catch(() => {});
  }
}

/** Parks the purchase until the gateway confirms payment (see trackPaidPurchase). */
export async function deferServerPurchase(p: ServerPurchase) {
  if (!isOrderId(p.orderId)) return;
  try {
    await mkdir(/*turbopackIgnore: true*/ STORE_DIR, { recursive: true });
    const tmp = path.join(/*turbopackIgnore: true*/ STORE_DIR, `.${p.orderId}.${randomUUID()}.tmp`);
    await writeFile(/*turbopackIgnore: true*/ tmp, JSON.stringify(p));
    await rename(/*turbopackIgnore: true*/ tmp, file(p.orderId, "json"));
    if (Math.random() < 0.05) after(() => sweep());
  } catch (e) {
    console.error("[purchase-store]", e instanceof Error ? e.message : e);
  }
}

type Claim = { status: "claimed"; purchase: ServerPurchase } | { status: "sent" | "missing" };

async function claim(orderId: number): Promise<Claim> {
  try {
    await rename(/*turbopackIgnore: true*/ file(orderId, "json"), file(orderId, "claimed"));
  } catch {
    const done = (await exists(file(orderId, "claimed"))) || (await exists(file(orderId, "sent")));
    return { status: done ? "sent" : "missing" };
  }
  try {
    const purchase = JSON.parse(await readFile(/*turbopackIgnore: true*/ file(orderId, "claimed"), "utf8")) as ServerPurchase;
    await rename(/*turbopackIgnore: true*/ file(orderId, "claimed"), file(orderId, "sent")).catch(() => {});
    return purchase.orderId === orderId ? { status: "claimed", purchase } : { status: "sent" };
  } catch {
    return { status: "sent" };
  }
}

/**
 * Call once a gateway confirms payment. `source: "browser"` (success
 * redirect) may fall back to a minimal Meta-only Purchase when nothing was
 * parked — safe, as Meta dedupes on event_id while GA4 could double count.
 * The IPN has no shopper context, so it only sends parked purchases.
 */
export function trackPaidPurchase(
  req: NextRequest,
  orderId: number,
  paidAmount: number,
  source: "browser" | "ipn"
) {
  if (!isOrderId(orderId)) return;
  const fallback =
    source === "browser"
      ? withBrowserContext(req, { orderId, value: Number(paidAmount) || 0, items: [], userData: {} })
      : null;

  after(async () => {
    const result = await claim(orderId);
    if (result.status === "claimed") return send(result.purchase, { ga4: true });
    if (result.status === "missing" && fallback) return send(fallback, { ga4: false });
  });
}
