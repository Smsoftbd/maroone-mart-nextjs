import { getTokenHeaders, getBkashBaseUrl } from "./bkash-headers";
import type { BkashCreds } from "@/lib/api/payments";

export async function generateGrantToken(creds: BkashCreds): Promise<string> {
  const res = await fetch(`${getBkashBaseUrl(creds)}/token/grant`, {
    method: "POST",
    headers: getTokenHeaders(creds),
    body: JSON.stringify({
      app_key: creds.app_key,
      app_secret: creds.app_secret,
    }),
  });

  const data = await res.json();

  if (!data?.id_token) {
    throw new Error(data?.message ?? "bKash token grant failed");
  }

  return data.id_token;
}
