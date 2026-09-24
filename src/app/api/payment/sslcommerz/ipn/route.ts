import { NextRequest, NextResponse } from "next/server";
import { verifyPayment } from "@/lib/api/orders";
import { getGatewayCredentials, type SslCreds } from "@/lib/api/payments";
import { trackPaidPurchase } from "@/lib/analytics/server-purchase";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SSLCommerzPayment = require("sslcommerz-lts");

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const data = Object.fromEntries(body.entries()) as Record<string, string>;

    const creds = await getGatewayCredentials<SslCreds>("sslcommerz");
    const sslcz = new SSLCommerzPayment(creds.store_id, creds.store_password, creds.is_live);
    const validation = await sslcz.validate({ val_id: data.val_id });

    if (validation?.status === "VALID" || validation?.status === "VALIDATED") {
      await verifyPayment("sslcommerz", { val_id: data.val_id, value_a: data.value_a }).catch(() => null);
      // Records the Purchase even if the shopper closed the tab before the success redirect.
      if (data.value_a) trackPaidPurchase(req, Number(data.value_a), Number(data.amount), "ipn");
      return NextResponse.json({ status: "ok" });
    }

    return NextResponse.json({ status: "invalid" }, { status: 400 });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
