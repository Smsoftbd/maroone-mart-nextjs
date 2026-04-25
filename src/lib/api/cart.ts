// Client-side cart API — no server-only import

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_API_KEY!;

import type { CartData, AddToCartResponse } from "./types";

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
  return res.json();
}

export async function getCart(auth: CartAuth): Promise<{ data: CartData }> {
  return cartFetch("/cart", { method: "GET", cache: "no-store" }, auth);
}

export async function addToCart(
  barcodeId: number,
  quantity: number,
  auth: CartAuth
): Promise<AddToCartResponse> {
  return cartFetch(
    "/cart/items",
    {
      method: "POST",
      body: JSON.stringify({ barcode_id: barcodeId, quantity }),
    },
    auth
  );
}

export async function updateCartItem(
  cartItemId: number,
  quantity: number,
  auth: CartAuth
): Promise<{ data: CartData }> {
  return cartFetch(
    `/cart/items/${cartItemId}`,
    {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    },
    auth
  );
}

export async function removeCartItem(
  cartItemId: number,
  auth: CartAuth
): Promise<{ data: CartData }> {
  return cartFetch(
    `/cart/items/${cartItemId}`,
    { method: "DELETE" },
    auth
  );
}

export async function clearCart(auth: CartAuth): Promise<{ data: CartData }> {
  return cartFetch("/cart", { method: "DELETE" }, auth);
}
