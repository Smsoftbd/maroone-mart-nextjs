import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateCoupon } from "@/lib/api/orders";

const schema = z.object({
  code: z.string().min(1),
  order_total: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 422 });
    }
    const result = await validateCoupon(parsed.data.code, parsed.data.order_total);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Coupon validation failed";
    return NextResponse.json({ error: msg, valid: false }, { status: 422 });
  }
}
