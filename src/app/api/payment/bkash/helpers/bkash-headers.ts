import type { BkashCreds } from "@/lib/api/payments";

const BKASH_SANDBOX_URL =
  "https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout";
const BKASH_LIVE_URL =
  "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout";

/** Resolve the bKash base URL from the live/sandbox flag (never stored/fetched). */
export const getBkashBaseUrl = (creds: BkashCreds) =>
  creds.is_live ? BKASH_LIVE_URL : BKASH_SANDBOX_URL;

export const getAuthHeaders = (creds: BkashCreds) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  "x-app-key": creds.app_key,
});

export const getTokenHeaders = (creds: BkashCreds) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  username: creds.username,
  password: creds.password,
});
