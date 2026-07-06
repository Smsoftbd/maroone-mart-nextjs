import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGatewayCredentials, type SslCreds } from "@/lib/api/payments";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SSLCommerzPayment = require("sslcommerz-lts");

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

const schema = z.object({
  order_id: z.number(),
  amount: z.number(),
  currency: z.string().default("BDT"),
  payment_method_id: z.number().int().positive(),
  customer: z.object({
    name: z.string(),
    email: z.string().optional(),
    phone: z.string(),
  }),
  shipping_address: z.object({
    address: z.string(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postcode: z.string().optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
    }

    const { order_id, amount, payment_method_id, customer, shipping_address } = parsed.data;
    const currency = parsed.data.currency === "৳" ? "BDT" : parsed.data.currency;

    const creds = await getGatewayCredentials<SslCreds>("sslcommerz");
    const sslcz = new SSLCommerzPayment(creds.store_id, creds.store_password, creds.is_live);

    const paymentData = {
      total_amount: amount,
      currency,
      tran_id: `order_${order_id}_${Date.now()}`,
      success_url: `${SITE_URL}/api/payment/sslcommerz/success`,
      fail_url: `${SITE_URL}/api/payment/sslcommerz/fail`,
      cancel_url: `${SITE_URL}/api/payment/sslcommerz/cancel`,
      ipn_url: `${SITE_URL}/api/payment/sslcommerz/ipn`,
      cus_name: customer.name,
      cus_email: customer.email ?? "",
      cus_phone: customer.phone,
      cus_add1: shipping_address.address,
      cus_city: shipping_address.city ?? "",
      cus_state: shipping_address.state ?? "",
      cus_country: shipping_address.country ?? "Bangladesh",
      cus_postcode: shipping_address.postcode ?? "1000",
      shipping_method: "courier",
      num_of_item: 1,
      product_name: `Order #${order_id}`,
      product_category: "General",
      product_profile: "physical",
      ship_name: customer.name,
      ship_add1: shipping_address.address,
      ship_city: shipping_address.city ?? "",
      ship_state: shipping_address.state ?? "",
      ship_country: shipping_address.country ?? "Bangladesh",
      ship_postcode: shipping_address.postcode ?? "1000",
      value_a: String(order_id),
      value_b: String(payment_method_id),
    };

    const response = await sslcz.init(paymentData);

    if (response?.status?.toUpperCase() !== "SUCCESS" || !response?.GatewayPageURL) {
      return NextResponse.json(
        { error: response?.failedreason ?? "SSLCommerz session failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({ gateway_url: response.GatewayPageURL });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Payment initiation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
