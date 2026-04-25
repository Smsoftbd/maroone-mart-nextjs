import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOrder } from "@/lib/api/orders";

const schema = z.object({
  customer: z.object({
    name: z.string().min(1).max(255),
    email: z.string().email().optional(),
    phone: z.string().min(1).max(50),
  }),
  items: z.array(
    z.object({
      barcode_id: z.number().int().positive(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
  shipping_address: z.object({
    address: z.string().min(1),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  }),
  payment_method: z.string().min(1).max(100),
  coupon_code: z.string().optional(),
  shipping_cost: z.number().optional(),
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
    const msg = e instanceof Error ? e.message : "Order creation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
