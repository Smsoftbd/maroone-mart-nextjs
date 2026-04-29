import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SSLCommerzPayment = require("sslcommerz-lts");

const STORE_ID = process.env.SSL_STORE_ID!;
const STORE_PASSWORD = process.env.SSL_STORE_PASSWORD!;
const IS_LIVE = process.env.SSL_IS_LIVE === "true";

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const data = Object.fromEntries(body.entries()) as Record<string, string>;

    const sslcz = new SSLCommerzPayment(STORE_ID, STORE_PASSWORD, IS_LIVE);
    const validation = await sslcz.validate({ val_id: data.val_id });

    if (validation?.status === "VALID" || validation?.status === "VALIDATED") {
      // Payment confirmed server-to-server.
      // Add any backend order status update here if needed.
      return NextResponse.json({ status: "ok" });
    }

    return NextResponse.json({ status: "invalid" }, { status: 400 });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
