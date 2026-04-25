import { NextRequest, NextResponse } from "next/server";
import { verifyPayment } from "@/lib/api/orders";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gateway: string }> }
) {
  const { gateway } = await params;
  try {
    const body = await req.json();
    const result = await verifyPayment(gateway, body);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Verification failed";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
