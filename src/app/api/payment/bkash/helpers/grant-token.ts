import { getTokenHeaders } from "./bkash-headers";

const BKASH_BASE_URL = process.env.BKASH_BASE_URL!;

export async function generateGrantToken(): Promise<string> {
  const res = await fetch(`${BKASH_BASE_URL}/token/grant`, {
    method: "POST",
    headers: getTokenHeaders(),
    body: JSON.stringify({
      app_key: process.env.BKASH_APP_KEY,
      app_secret: process.env.BKASH_APP_SECRET,
    }),
  });

  const data = await res.json();

  if (!data?.id_token) {
    throw new Error(data?.message ?? "bKash token grant failed");
  }

  return data.id_token;
}
