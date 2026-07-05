// Client-side customer API — no server-only import

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_API_KEY!;

import type {
  AuthResponse,
  Customer,
  RegisterData,
  UpdateProfileData,
  WishlistItem,
  LoyaltyData,
  ReturnRequest,
  CreateReturnPayload,
  PaginatedResponse,
  OrderListItem,
  Order,
  StatusHistoryItem,
} from "./types";

function authHeaders(token: string): Record<string, string> {
  return {
    "X-Api-Key": PUBLIC_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function publicHeaders(): Record<string, string> {
  return {
    "X-Api-Key": PUBLIC_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function customerFetch<T>(
  path: string,
  options: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { ...options, cache: "no-store" });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    const err = new Error(error.message || error.error || "Request failed") as Error & {
      status: number;
      errors?: Record<string, string[]>;
    };
    err.status = res.status;
    err.errors = error.errors;
    throw err;
  }
  return res.json();
}

export async function loginCustomer(
  email: string,
  password: string
): Promise<AuthResponse> {
  return customerFetch("/customer/login", {
    method: "POST",
    headers: publicHeaders(),
    body: JSON.stringify({ email, password }),
  });
}

export async function registerCustomer(
  data: RegisterData
): Promise<AuthResponse> {
  return customerFetch("/customer/register", {
    method: "POST",
    headers: publicHeaders(),
    body: JSON.stringify(data),
  });
}

export async function requestOtp(phone: string): Promise<{ message: string }> {
  return customerFetch("/customer/otp/request", {
    method: "POST",
    headers: publicHeaders(),
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(
  phone: string,
  code: string,
  name?: string
): Promise<AuthResponse> {
  return customerFetch("/customer/otp/verify", {
    method: "POST",
    headers: publicHeaders(),
    body: JSON.stringify({ phone, code, ...(name ? { name } : {}) }),
  });
}

/** Verify a phone at checkout without logging in (store requires checkout OTP). */
export async function checkoutVerifyOtp(
  phone: string,
  code: string
): Promise<{ verified: boolean }> {
  return customerFetch("/customer/otp/checkout-verify", {
    method: "POST",
    headers: publicHeaders(),
    body: JSON.stringify({ phone, code }),
  });
}

export async function logoutCustomer(token: string): Promise<{ message: string }> {
  return customerFetch("/customer/logout", {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function getCustomerProfile(token: string): Promise<{ customer: Customer }> {
  return customerFetch("/customer/me", {
    method: "GET",
    headers: authHeaders(token),
  });
}

export async function updateCustomerProfile(
  token: string,
  data: UpdateProfileData
): Promise<{ message: string; customer: Customer }> {
  return customerFetch("/customer/me", {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function getCustomerOrders(
  token: string,
  page = 1
): Promise<PaginatedResponse<OrderListItem>> {
  return customerFetch(`/customer/orders?per_page=15&page=${page}`, {
    method: "GET",
    headers: authHeaders(token),
  });
}

export async function getCustomerOrder(
  token: string,
  id: number
): Promise<{ data: Order; status_history: StatusHistoryItem[] }> {
  return customerFetch(`/customer/orders/${id}`, {
    method: "GET",
    headers: authHeaders(token),
  });
}

export async function getWishlist(token: string): Promise<{ data: WishlistItem[] }> {
  return customerFetch("/customer/wishlist", {
    method: "GET",
    headers: authHeaders(token),
  });
}

export async function addToWishlist(
  token: string,
  productSlug: string
): Promise<{ message: string; data: WishlistItem }> {
  return customerFetch("/customer/wishlist", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ product_slug: productSlug }),
  });
}

export async function removeFromWishlist(
  token: string,
  wishlistItemId: number
): Promise<{ message: string }> {
  return customerFetch(`/customer/wishlist/${wishlistItemId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function getLoyalty(token: string): Promise<{ data: LoyaltyData }> {
  return customerFetch("/customer/loyalty", {
    method: "GET",
    headers: authHeaders(token),
  });
}

export async function getReturns(token: string): Promise<{ data: ReturnRequest[] }> {
  return customerFetch("/customer/returns", {
    method: "GET",
    headers: authHeaders(token),
  });
}

export async function createReturn(
  token: string,
  payload: CreateReturnPayload
): Promise<{ message: string; data: ReturnRequest }> {
  return customerFetch("/customer/returns", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function cancelReturn(
  token: string,
  returnId: number
): Promise<{ message: string }> {
  return customerFetch(`/customer/returns/${returnId}/cancel`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
}
