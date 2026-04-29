import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateGrantToken } from "../helpers/grant-token";
import { getAuthHeaders } from "../helpers/bkash-headers";

const BKASH_BASE_URL = process.env.BKASH_BASE_URL!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

const schema = z.object({
  order_id: z.number().int().positive(),
  amount: z.number().positive(),
  payment_method_id: z.number().int().positive(),
  customer: z.object({
    name: z.string(),
    phone: z.string(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
    }

    const { order_id, amount, payment_method_id, customer } = parsed.data;

    const token = await generateGrantToken();

    const callbackURL =
      `${SITE_URL}/api/payment/bkash/callback` +
      `?order_id=${order_id}&payment_method_id=${payment_method_id}`;

    const res = await fetch(`${BKASH_BASE_URL}/create`, {
      method: "POST",
      headers: { ...getAuthHeaders(), authorization: token },
      body: JSON.stringify({
        mode: "0011",
        payerReference: customer.phone,
        callbackURL,
        amount: String(amount),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: String(order_id),
      }),
    });

    const data = await res.json();

    if (!data?.bkashURL) {
      return NextResponse.json(
        { error: data?.statusMessage ?? "bKash payment creation failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({ bkash_url: data.bkashURL });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Payment initiation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
