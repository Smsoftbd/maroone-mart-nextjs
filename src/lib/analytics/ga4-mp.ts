import "server-only";

import { createHash, randomInt } from "node:crypto";
import type { Ga4MpConfig } from "./gtm-config";
import type { MetaUserData } from "./meta-shared";

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

type CookieReader = { get(name: string): { value: string } | undefined };

export type GaIds = { clientId?: string; sessionId?: string };

/** client_id from `_ga` and session_id from `_ga_<stream>` (GS1 and GS2 formats). */
export function readGaIds(cookies: CookieReader, measurementId?: string): GaIds {
  const ga = cookies.get("_ga")?.value.split(".");
  const clientId = ga && ga.length >= 4 ? ga.slice(-2).join(".") : undefined;

  let sessionId: string | undefined;
  if (measurementId) {
    const v = cookies.get(`_ga_${measurementId.replace(/^G-/, "")}`)?.value ?? "";
    sessionId = (v.match(/^GS1\.\d+\.(\d+)/) ?? v.match(/^GS2\.\d+\.s(\d+)/))?.[1];
  }
  return { clientId, sessionId };
}

export type Ga4Purchase = {
  ids: GaIds;
  userId?: string;
  ip?: string;
  userAgent?: string;
  userData: MetaUserData;
  eventId: string;
  transactionId: string;
  value: number;
  currency: string;
  items: { item_id: string; quantity: number; price: number }[];
};

/** Hashed user-provided data in Measurement Protocol shape. */
function mpUserData(ud: MetaUserData) {
  const address = {
    ...(ud.fn && { sha256_first_name: sha256(ud.fn) }),
    ...(ud.ln && { sha256_last_name: sha256(ud.ln) }),
    ...(ud.ct && { city: ud.ct }),
    ...(ud.st && { region: ud.st }),
    ...(ud.zp && { postal_code: ud.zp }),
    ...(ud.country && { country: ud.country.toUpperCase() }),
  };
  const out = {
    ...(ud.em && { sha256_email_address: [sha256(ud.em)] }),
    ...(ud.ph && { sha256_phone_number: [sha256(`+${ud.ph}`)] }),
    ...(Object.keys(address).length > 0 && { address: [address] }),
  };
  return Object.keys(out).length ? out : undefined;
}

export async function sendGa4Purchase(config: Ga4MpConfig, p: Ga4Purchase): Promise<void> {
  // No _ga cookie (blocked/cleared): still record revenue under a fresh client id.
  const clientId = p.ids.clientId ?? `${randomInt(1_000_000_000, 2_147_483_647)}.${Math.floor(Date.now() / 1000)}`;
  const body = {
    client_id: clientId,
    ...(p.userId && { user_id: p.userId }),
    ...(p.ip && { ip_override: p.ip }),
    ...(mpUserData(p.userData) && { user_data: mpUserData(p.userData) }),
    events: [
      {
        name: "purchase",
        params: {
          transaction_id: p.transactionId,
          currency: p.currency,
          value: p.value,
          items: p.items,
          event_id: p.eventId,
          engagement_time_msec: 1,
          ...(p.ids.sessionId && { session_id: p.ids.sessionId }),
        },
      },
    ],
  };

  const url =
    `${config.endpoint}?measurement_id=${encodeURIComponent(config.measurementId)}` +
    `&api_secret=${encodeURIComponent(config.apiSecret)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      // Server-side GTM reads the device from the request's User-Agent.
      headers: { "Content-Type": "application/json", ...(p.userAgent && { "User-Agent": p.userAgent }) },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[ga4-mp]", res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.error("[ga4-mp]", e instanceof Error ? e.message : e);
  }
}
