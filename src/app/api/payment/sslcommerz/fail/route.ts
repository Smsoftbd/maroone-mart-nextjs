import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.formData();
  const data = Object.fromEntries(body.entries()) as Record<string, string>;
  const params = new URLSearchParams({
    status: "failed",
    ...(data.value_a ? { order_id: data.value_a } : {}),
  });
  return NextResponse.redirect(new URL(`/payment/result?${params}`, req.url));
}
