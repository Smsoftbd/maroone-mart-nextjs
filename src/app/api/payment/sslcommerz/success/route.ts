import { NextRequest, NextResponse } from "next/server";
import { confirmPayment, verifyPayment } from "@/lib/api/orders";
import { getGatewayCredentials, type SslCreds } from "@/lib/api/payments";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SSLCommerzPayment = require("sslcommerz-lts");

export async function POST(req: NextRequest) {
  const body = await req.formData();
  const data = Object.fromEntries(body.entries()) as Record<string, string>;
  const orderId = data.value_a;
  const paymentMethodId = data.value_b ? Number(data.value_b) : null;

  try {
    const creds = await getGatewayCredentials<SslCreds>("sslcommerz");
    const sslcz = new SSLCommerzPayment(creds.store_id, creds.store_password, creds.is_live);
    const validation = await sslcz.validate({ val_id: data.val_id });

    if (validation?.status === "VALID" || validation?.status === "VALIDATED") {
      await verifyPayment("sslcommerz", { val_id: data.val_id, value_a: orderId }).catch(() => null);

      if (orderId && paymentMethodId && data.amount) {
        await confirmPayment(Number(orderId), {
          transaction_id: data.tran_id,
          payment_method_id: paymentMethodId,
          amount: Number(data.amount),
          payment_status: "paid",
        }).catch(() => null);
      }

      const params = new URLSearchParams({
        status: "success",
        ...(orderId ? { order_id: orderId } : {}),
        ...(data.tran_id ? { tran_id: data.tran_id } : {}),
      });
      return NextResponse.redirect(new URL(`/payment/result?${params}`, req.url));
    }

    const params = new URLSearchParams({
      status: "failed",
      ...(orderId ? { order_id: orderId } : {}),
    });
    return NextResponse.redirect(new URL(`/payment/result?${params}`, req.url));
  } catch {
    const params = new URLSearchParams({
      status: "failed",
      ...(orderId ? { order_id: orderId } : {}),
    });
    return NextResponse.redirect(new URL(`/payment/result?${params}`, req.url));
  }
}
