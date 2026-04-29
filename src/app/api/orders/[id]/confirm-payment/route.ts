import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { confirmPayment } from "@/lib/api/orders";

const schema = z.object({
  transaction_id: z.string().min(1),
  payment_method_id: z.number().int().positive(),
  amount: z.number().positive(),
  payment_status: z.enum(["paid", "partial", "due"]),
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
      return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
    }
    const result = await confirmPayment(Number(id), parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to confirm payment";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
