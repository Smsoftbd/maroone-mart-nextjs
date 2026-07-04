import "server-only";

import { apiRequest } from "./client";
import type {
  CreateOrderPayload,
  CreateOrderResponse,
  Order,
  InitiatePaymentResponse,
  VerifyPaymentResponse,
  ConfirmPaymentResponse,
  CouponValidationResponse,
} from "./types";

export async function createOrder(
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> {
  return apiRequest<CreateOrderResponse>("/orders", {
    keyType: "secret",
    method: "POST",
    body: payload,
    cache: "no-store",
  });
}

export async function getCouponAvailability(): Promise<boolean> {
  try {
    const res = await apiRequest<{ available: boolean }>("/coupons/available", {
      revalidate: 300,
    });
    return res.available;
  } catch {
    return false; // no coupons / transient error → hide the section
  }
}

export async function getOrder(
  id: number,
  phone: string
): Promise<{ data: Order }> {
  return apiRequest<{ data: Order }>(`/orders/${id}?phone=${encodeURIComponent(phone)}`, {
    keyType: "secret",
    cache: "no-store",
  });
}

export async function initiatePayment(
  orderId: number,
  gateway: "sslcommerz" | "stripe",
  options?: {
    currency?: string;
    success_url?: string;
    fail_url?: string;
    cancel_url?: string;
    value_a?: string | number;
  }
): Promise<InitiatePaymentResponse> {
  return apiRequest<InitiatePaymentResponse>(`/orders/${orderId}/pay`, {
    keyType: "secret",
    method: "POST",
    body: { gateway, ...options },
    cache: "no-store",
  });
}

export async function verifyPayment(
  gateway: string,
  data: Record<string, string>
): Promise<VerifyPaymentResponse> {
  return apiRequest<VerifyPaymentResponse>(`/payment/${gateway}/verify`, {
    keyType: "secret",
    method: "POST",
    body: data,
    cache: "no-store",
  });
}

export async function confirmPayment(
  orderId: number,
  data: {
    transaction_id: string;
    payment_method_id: number;
    amount: number;
    payment_status: "paid" | "partial" | "due";
  }
): Promise<ConfirmPaymentResponse> {
  return apiRequest<ConfirmPaymentResponse>(`/orders/${orderId}/confirm-payment`, {
    keyType: "secret",
    method: "POST",
    body: data,
    cache: "no-store",
  });
}

export async function validateCoupon(
  code: string,
  orderTotal: number
): Promise<CouponValidationResponse> {
  return apiRequest<CouponValidationResponse>("/coupons/validate", {
    keyType: "secret",
    method: "POST",
    body: { code, order_total: orderTotal },
    cache: "no-store",
  });
}
