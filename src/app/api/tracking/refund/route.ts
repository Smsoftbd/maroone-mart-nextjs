import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { getGa4MpConfig } from "@/lib/analytics/gtm-config";
import { sendGa4Refund } from "@/lib/analytics/ga4-mp";
import { META_CURRENCY } from "@/lib/analytics/meta-shared";

/**
 * Backend → GA4 refund webhook. The backend calls this when a return/refund
 * is approved, with `Authorization: Bearer <TRACKING_WEBHOOK_SECRET>`.
 * `transaction_id` must be the invoice number used for the purchase.
 * Omit `items` for a full refund; list them for a partial one.
 */

const schema = z.object({
  transaction_id: z.string().min(1).max(100),
  value: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  items: z
    .array(
      z.object({
        item_id: z.union([z.string().min(1).max(100), z.number().int().positive()]),
        item_name: z.string().max(255).optional(),
        quantity: z.number().int().positive(),
        price: z.number().nonnegative(),
      })
    )
    .max(200)
    .optional(),
});

function authorized(req: NextRequest): boolean {
  const secret = process.env.TRACKING_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const config = getGa4MpConfig();
  if (!config) return NextResponse.json({ status: "skipped", reason: "GA4 not configured" });

  const r = parsed.data;
  after(() =>
    sendGa4Refund(config, {
      transactionId: r.transaction_id,
      value: r.value,
      currency: r.currency?.toUpperCase() ?? META_CURRENCY,
      items: r.items?.map((i) => ({ ...i, item_id: String(i.item_id) })),
    })
  );
  return NextResponse.json({ status: "queued" }, { status: 202 });
}
