import { apiRequest } from "./client";

export interface SslCreds {
  store_id: string;
  store_password: string;
  is_live: boolean;
}

export interface BkashCreds {
  is_live: boolean;
  username: string;
  password: string;
  app_key: string;
  app_secret: string;
}

/**
 * Fetch a gateway's credentials from the elevenpos backend (secret endpoint).
 * Server-only — uses the sk_ key. Replaces the former SSL and BKASH env vars.
 */
export async function getGatewayCredentials<T>(gateway: string): Promise<T> {
  const res = await apiRequest<{ data: T }>(
    `/payment-methods/${gateway}/credentials`,
    { keyType: "secret", revalidate: 300, tags: ["payment-credentials"] }
  );
  return res.data;
}
