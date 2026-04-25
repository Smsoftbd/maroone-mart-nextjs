import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { initiatePayment } from "@/lib/api/orders";

const schema = z.object({
  gateway: z.enum(["sslcommerz", "stripe"]),
  currency: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid gateway" }, { status: 422 });
    }
    const result = await initiatePayment(
      Number(id),
      parsed.data.gateway,
      parsed.data.currency
    );
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Payment initiation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const phone = req.nextUrl.searchParams.get("phone") || "";
  try {
    const { getOrder } = await import("@/lib/api/orders");
    const result = await getOrder(Number(id), phone);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Not found";
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}
