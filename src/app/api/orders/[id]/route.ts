import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/api/orders";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const phone = req.nextUrl.searchParams.get("phone") || "";
  try {
    const result = await getOrder(Number(id), phone);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
}
