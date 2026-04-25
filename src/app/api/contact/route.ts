import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiRequest } from "@/lib/api/client";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }
    const result = await apiRequest("/contact", {
      keyType: "secret",
      method: "POST",
      body: parsed.data,
      cache: "no-store",
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Contact form failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
