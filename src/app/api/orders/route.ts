import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOrder } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";

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
});

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
    const result = await createOrder(parsed.data);
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
