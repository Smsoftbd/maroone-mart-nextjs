import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOrder } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { getStore } from "@/lib/api/store";
import { buildMetaUserData } from "@/lib/analytics/meta-shared";
import { isOnlinePaymentGateway } from "@/lib/analytics/purchase-shared";
import {
  deferServerPurchase,
  trackServerPurchase,
  withBrowserIds,
} from "@/lib/analytics/server-purchase";

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
  // Tracking context only — never forwarded to the backend.
  tracking: z
    .object({
      external_id: z.string().max(100).optional(),
      event_source_url: z.string().max(2048).optional(),
      payment_gateway: z.string().max(50).optional(),
    })
    .optional(),
});

type OrderInput = z.infer<typeof schema>;

/**
 * Server half of the Purchase event (browser fires the same event id). Online
 * gateway orders are parked until the gateway confirms payment.
 */
async function trackPurchase(
  req: NextRequest,
  res: NextResponse,
  input: OrderInput,
  order: { id: number; invoice_number: string; net_total: number }
) {
  const store = await getStore().catch(() => null);
  const purchase = withBrowserIds(req, {
    orderId: order.id,
    invoice: order.invoice_number || undefined,
    value: Number(order.net_total) || input.summary.net_total,
    items: input.items.map((i) => ({ id: String(i.barcode_id), qty: i.qty, price: i.price })),
    userData: buildMetaUserData({
      name: input.customer.name,
      email: input.customer.email,
      phone: input.customer.phone,
      city: input.shipping_address.city,
      state: input.shipping_address.state,
      country: input.shipping_address.country || store?.country,
      id: input.tracking?.external_id,
    }),
    sourceUrl: input.tracking?.event_source_url || req.headers.get("referer") || undefined,
  });

  if (isOnlinePaymentGateway(input.tracking?.payment_gateway)) {
    deferServerPurchase(res, purchase);
  } else {
    trackServerPurchase(req, purchase);
  }
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
    const res = NextResponse.json(result, { status: 201 });
    await trackPurchase(req, res, parsed.data, result.order).catch(() => {});
    return res;
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
