import "server-only";

import { createHash, randomInt } from "node:crypto";
import type { NextRequest } from "next/server";
import type { MetaCapiConfig } from "@/lib/api/store";
import type { MetaCustomData, MetaEventName, MetaUserData } from "./meta-shared";

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || "v24.0";

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export type MetaServerEvent = {
  event_name: MetaEventName;
  event_id: string;
  event_source_url?: string;
  user_data: MetaUserData;
  custom_data?: MetaCustomData;
};

/** Browser signals Meta uses for matching: IP, UA, _fbp and _fbc. */
export type MetaRequestContext = {
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  /** Set when _fbp was missing and we minted one — caller should persist it as a cookie. */
  newFbp?: string;
};

export function getMetaRequestContext(req: NextRequest, sourceUrl?: string): MetaRequestContext {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    undefined;
  const userAgent = req.headers.get("user-agent") || undefined;

  let fbp = req.cookies.get("_fbp")?.value;
  let newFbp: string | undefined;
  if (!fbp) {
    // Pixel blocked or not loaded yet: mint the same cookie format fbevents.js
    // uses so this browser keeps one stable id across server events.
    fbp = newFbp = `fb.1.${Date.now()}.${randomInt(1_000_000_000, 2_147_483_647)}`;
  }

  let fbc = req.cookies.get("_fbc")?.value;
  if (!fbc && sourceUrl) {
    try {
      const fbclid = new URL(sourceUrl).searchParams.get("fbclid");
      if (fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;
    } catch {
      // ignore malformed URL
    }
  }

  return { ip, userAgent, fbp, fbc, newFbp };
}

function hashUserData(ud: MetaUserData, ctx: MetaRequestContext) {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(ud)) {
    if (v) out[k] = [sha256(v)];
  }
  if (ctx.ip) out.client_ip_address = ctx.ip;
  if (ctx.userAgent) out.client_user_agent = ctx.userAgent;
  if (ctx.fbp) out.fbp = ctx.fbp;
  if (ctx.fbc) out.fbc = ctx.fbc;
  return out;
}

export async function sendMetaEvents(
  config: MetaCapiConfig,
  events: MetaServerEvent[],
  ctx: MetaRequestContext
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const data = events.map((e) => ({
    event_name: e.event_name,
    event_time: now,
    event_id: e.event_id,
    event_source_url: e.event_source_url,
    action_source: "website",
    user_data: hashUserData(e.user_data, ctx),
    custom_data: e.custom_data,
  }));

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${config.pixelId}/events?access_token=${encodeURIComponent(config.accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data,
          ...(config.testEventCode && { test_event_code: config.testEventCode }),
        }),
        cache: "no-store",
      }
    );
    if (!res.ok) {
      console.error("[meta-capi]", res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.error("[meta-capi]", e instanceof Error ? e.message : e);
  }
}

export const FBP_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;
