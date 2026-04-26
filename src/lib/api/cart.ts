// Client-side cart API — no server-only import

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_API_KEY!;

import type { CartData, AddToCartResponse } from "./types";
import { resolveL10n } from "@/lib/utils/l10n";

function normalizeCartData(data: CartData): CartData {
  return {
    ...data,
    items: data.items.map((item) => ({
      ...item,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      product_name: resolveL10n(item.product_name as any),
    })),
  };
}

type CartAuth = {
  cartToken?: string | null;
  bearerToken?: string | null;
};

function cartHeaders(auth: CartAuth): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Api-Key": PUBLIC_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (auth.bearerToken) headers["Authorization"] = `Bearer ${auth.bearerToken}`;
  if (auth.cartToken) headers["X-Cart-Token"] = auth.cartToken;
  return headers;
}

async function cartFetch<T>(
  path: string,
  options: RequestInit,
  auth: CartAuth
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: cartHeaders(auth),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || error.error || "Cart request failed");
  }
  const json = await res.json();
  console.log("[cart-api] full response:", JSON.stringify(json, null, 2));
  console.log("[cart-api] first item:", json?.data?.items?.[0] ? JSON.stringify(json.data.items[0], null, 2) : "no items");
  return json;
}

export async function getCart(auth: CartAuth): Promise<{ data: CartData }> {
  const res = await cartFetch<{ data: CartData }>("/cart", { method: "GET", cache: "no-store" }, auth);
  return { data: normalizeCartData(res.data) };
}

export async function addToCart(
  barcodeId: number,
  quantity: number,
  auth: CartAuth
): Promise<AddToCartResponse> {
  const res = await cartFetch<AddToCartResponse>(
    "/cart/items",
    {
      method: "POST",
      body: JSON.stringify({ barcode_id: barcodeId, quantity }),
    },
    auth
  );
  return { ...res, data: normalizeCartData(res.data) };
}

export async function updateCartItem(
  cartItemId: number,
  quantity: number,
  auth: CartAuth
): Promise<{ data: CartData }> {
  const res = await cartFetch<{ data: CartData }>(
    `/cart/items/${cartItemId}`,
    {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    },
    auth
  );
  return { data: normalizeCartData(res.data) };
}

export async function removeCartItem(
  cartItemId: number,
  auth: CartAuth
): Promise<{ data: CartData }> {
  const res = await cartFetch<{ data: CartData }>(
    `/cart/items/${cartItemId}`,
    { method: "DELETE" },
    auth
  );
  return { data: normalizeCartData(res.data) };
}

export async function clearCart(auth: CartAuth): Promise<{ data: CartData }> {
  const res = await cartFetch<{ data: CartData }>("/cart", { method: "DELETE" }, auth);
  return { data: normalizeCartData(res.data) };
}
