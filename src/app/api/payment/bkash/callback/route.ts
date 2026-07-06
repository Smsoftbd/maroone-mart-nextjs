import { NextRequest, NextResponse } from "next/server";
import { confirmPayment } from "@/lib/api/orders";
import { generateGrantToken } from "../helpers/grant-token";
import { getAuthHeaders, getBkashBaseUrl } from "../helpers/bkash-headers";
import { getGatewayCredentials, type BkashCreds } from "@/lib/api/payments";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentID = searchParams.get("paymentID");
  const status = searchParams.get("status");
  const orderId = searchParams.get("order_id");
  const paymentMethodId = searchParams.get("payment_method_id");

  const failParams = new URLSearchParams({
    status: status === "cancel" ? "cancelled" : "failed",
    ...(orderId ? { order_id: orderId } : {}),
  });
  const failUrl = new URL(`/payment/result?${failParams}`, req.url);

  if (status !== "success" || !paymentID) {
    return NextResponse.redirect(failUrl);
  }

  try {
    const creds = await getGatewayCredentials<BkashCreds>("bkash");
    const token = await generateGrantToken(creds);

    const res = await fetch(`${getBkashBaseUrl(creds)}/execute`, {
      method: "POST",
      headers: { ...getAuthHeaders(creds), authorization: token },
      body: JSON.stringify({ paymentID }),
    });

    const result = await res.json();

    if (result?.statusCode === "0000") {
      if (orderId && paymentMethodId && result.amount) {
        await confirmPayment(Number(orderId), {
          transaction_id: result.trxID,
          payment_method_id: Number(paymentMethodId),
          amount: Number(result.amount),
          payment_status: "paid",
        }).catch(() => null);
      }

      const successParams = new URLSearchParams({
        status: "success",
        ...(orderId ? { order_id: orderId } : {}),
        ...(result.trxID ? { tran_id: result.trxID } : {}),
      });
      return NextResponse.redirect(new URL(`/payment/result?${successParams}`, req.url));
    }

    return NextResponse.redirect(failUrl);
  } catch {
    return NextResponse.redirect(failUrl);
  }
}
