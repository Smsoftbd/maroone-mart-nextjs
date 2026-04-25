import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiRequest } from "@/lib/api/client";

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 422 });
    }
    const result = await apiRequest("/newsletter/subscribe", {
      keyType: "secret",
      method: "POST",
      body: parsed.data,
      cache: "no-store",
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Subscribe failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
