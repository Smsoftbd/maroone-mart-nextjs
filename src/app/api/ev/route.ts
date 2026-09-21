import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { getMetaCapiConfig } from "@/lib/api/store";
import {
  FBP_COOKIE_MAX_AGE,
  getMetaRequestContext,
  sendMetaEvents,
} from "@/lib/analytics/meta-capi";
import { META_CLIENT_EVENTS, type MetaCustomData } from "@/lib/analytics/meta-shared";
import { resolveConsent } from "@/lib/analytics/consent-server";
import { isMetaViaSgtm } from "@/lib/analytics/gtm-config";

// Browser → Conversions API relay. Short, neutral path so ad blockers that
// strip Pixel requests don't also drop the server-side copy.

const str = (max: number) => z.string().max(max).optional();

const schema = z.object({
  event_name: z.enum(META_CLIENT_EVENTS),
  event_id: z.string().min(1).max(100),
  event_source_url: z.string().max(2048).optional(),
  user_data: z
    .object({
      em: str(255),
      ph: str(32),
      fn: str(100),
      ln: str(100),
      ct: str(100),
      st: str(100),
      zp: str(20),
      country: str(2),
      external_id: str(100),
    })
    .default({}),
  custom_data: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || JSON.stringify(parsed.data).length > 16_000) {
    return new NextResponse(null, { status: 400 });
  }
  const event = parsed.data;
  const res = new NextResponse(null, { status: 204 });
  // No marketing consent, or server-side GTM owns Meta CAPI: nothing to relay.
  if (isMetaViaSgtm() || !resolveConsent(req.headers, req.cookies).marketing) return res;
  const config = await getMetaCapiConfig();
  if (!config) return res;

  const ctx = getMetaRequestContext(req, event.event_source_url);
  if (ctx.newFbp) {
    res.cookies.set("_fbp", ctx.newFbp, {
      path: "/",
      maxAge: FBP_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }

  after(() =>
    sendMetaEvents(
      config,
      [{ ...event, custom_data: event.custom_data as MetaCustomData | undefined }],
      ctx
    )
  );
  return res;
}
