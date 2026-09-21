import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { createOrder } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { getMetaCapiConfig, getStore } from "@/lib/api/store";
import { getMetaRequestContext, sendMetaEvents } from "@/lib/analytics/meta-capi";
import { META_CURRENCY, buildMetaUserData, purchaseEventId } from "@/lib/analytics/meta-shared";

const schema = z.object({
  customer: z.object({
    name: z.string().min(1).max(255),
    email: z.string().email().optional(),
    phone: z.string().min(1).max(50),
  }),
  items: z.array(
    z.object({
      barcode_id: z.number().int().positive(),
      qty: z.number().int().positive(),
      price: z.number().nonnegative(),
      discount_percent: z.number().nonnegative(),
      invoice_discount_percent: z.number().nonnegative(),
      tax_percent: z.number().nonnegative(),
      sub_total: z.number().nonnegative(),
      net_total: z.number().nonnegative(),
    })
  ).min(1),
  summary: z.object({
    sub_total: z.number().nonnegative(),
    discount_amount: z.number().nonnegative(),
    customer_delivery_charge: z.number().nonnegative(),
    tax_total: z.number().nonnegative(),
    net_total: z.number().nonnegative(),
  }),
  shipping_address: z.object({
    address: z.string().min(10),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  }),
  coupon_code: z.string().optional(),
  note: z.string().optional(),
  // Meta CAPI context only — never forwarded to the backend.
  tracking: z
    .object({
      external_id: z.string().max(100).optional(),
      event_source_url: z.string().max(2048).optional(),
    })
    .optional(),
});

type OrderInput = z.infer<typeof schema>;

/** Server half of the Purchase event (browser Pixel fires the same event id). */
async function trackPurchase(
  req: NextRequest,
  input: OrderInput,
  order: { id: number; invoice_number: string; net_total: number }
) {
  const config = await getMetaCapiConfig();
  if (!config) return;
  const store = await getStore().catch(() => null);
  const sourceUrl = input.tracking?.event_source_url || req.headers.get("referer") || undefined;
  const ctx = getMetaRequestContext(req, sourceUrl);

  after(() =>
    sendMetaEvents(
      config,
      [
        {
          event_name: "Purchase",
          event_id: purchaseEventId(order.id),
          event_source_url: sourceUrl,
          user_data: buildMetaUserData({
            name: input.customer.name,
            email: input.customer.email,
            phone: input.customer.phone,
            city: input.shipping_address.city,
            state: input.shipping_address.state,
            country: input.shipping_address.country || store?.country,
            id: input.tracking?.external_id,
          }),
          custom_data: {
            value: Number(order.net_total) || input.summary.net_total,
            currency: META_CURRENCY,
            content_type: "product",
            content_ids: input.items.map((i) => String(i.barcode_id)),
            contents: input.items.map((i) => ({
              id: String(i.barcode_id),
              quantity: i.qty,
              item_price: i.price,
            })),
            num_items: input.items.reduce((n, i) => n + i.qty, 0),
            order_id: order.invoice_number || String(order.id),
          },
        },
      ],
      ctx
    )
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }
    const { tracking: _tracking, ...orderPayload } = parsed.data; // eslint-disable-line @typescript-eslint/no-unused-vars
    const result = await createOrder(orderPayload);
    await trackPurchase(req, parsed.data, result.order).catch(() => {});
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof ApiError) {
      // Propagate backend validation (422) with field errors intact.
      return NextResponse.json(
        { error: e.message, errors: e.errors },
        { status: e.status }
      );
    }
    const msg = e instanceof Error ? e.message : "Order creation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
