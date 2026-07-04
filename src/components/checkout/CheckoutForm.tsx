"use client";

import { useMemo, useState } from "react";
import { useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ShippingSelector } from "./ShippingSelector";
import { PaymentSelector } from "./PaymentSelector";
import { CouponInput } from "./CouponInput";
import { useCartStore } from "@/lib/stores/cartStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { formatPrice } from "@/lib/utils/format";
import { appToast } from "@/lib/utils/toast";
import type { DeliveryCharge, PaymentMethod } from "@/lib/api/types";
import { resolveL10n } from "@/lib/utils/l10n";
import { isBdPhone, isBangladesh } from "@/lib/utils/phone";

function makeSchema(country: string) {
  const phone = isBangladesh(country)
    ? z
        .string()
        .min(1, "Phone is required")
        .refine(isBdPhone, "Enter a valid Bangladeshi number, e.g. 01712345678")
    : z.string().min(5, "Phone is required").max(50);

  return z.object({
    name: z.string().min(1, "Name is required").max(255),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone,
    address: z.string().min(10, "Address must be at least 10 characters"),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    note: z.string().optional(),
  });
}

type FormData = z.infer<ReturnType<typeof makeSchema>>;

// Laravel validation keys → form field names.
const SERVER_FIELD_MAP: Record<string, Path<FormData>> = {
  "customer.name": "name",
  "customer.email": "email",
  "customer.phone": "phone",
  "shipping_address.address": "address",
};

interface CheckoutFormProps {
  currency: string;
  /** Org's country — fixed, non-editable at checkout. */
  country: string;
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-white border border-[var(--color-border)] rounded-2xl p-6">
      {children}
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-base font-semibold mb-4">{children}</h2>
  );
}

export function CheckoutForm({ currency, country }: CheckoutFormProps) {
  const router = useRouter();
  const { items, subTotal, priceOverrides, attributeOverrides, clearCart } = useCartStore();
  const { customer, token } = useAuthStore();
  const [delivery, setDelivery] = useState<DeliveryCharge | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(() => makeSchema(country), [country]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer?.name ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      address: customer?.address ?? "",
      city: customer?.city ?? "",
      state: customer?.state ?? "",
      country,
    },
  });

  const shippingCost = delivery ? parseFloat(delivery.charge_amount) : 0;
  const total = subTotal + shippingCost - discountAmount;

  const onSubmit = async (data: FormData) => {
    if (!paymentMethod) {
      appToast.apiError("Please select a payment method.");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems = items.map((i) => {
        const price = i.unit_price || priceOverrides[i.barcode_id] || 0;
        const itemSubTotal = price * i.quantity;
        return {
          barcode_id: i.barcode_id,
          qty: i.quantity,
          price,
          discount_percent: 0,
          invoice_discount_percent: 0,
          tax_percent: 0,
          sub_total: itemSubTotal,
          net_total: itemSubTotal,
        };
      });

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: data.name, email: data.email || undefined, phone: data.phone },
          items: orderItems,
          summary: {
            sub_total: subTotal,
            discount_amount: discountAmount,
            shipping_cost: shippingCost,
            tax_total: 0,
            net_total: total,
          },
          shipping_address: {
            address: data.address,
            city: data.city,
            state: data.state,
            country: data.country,
          },
          coupon_code: couponCode || undefined,
          note: data.note,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        const fieldErrors = result.errors as Record<string, string[]> | undefined;
        let firstMsg: string | undefined;
        if (fieldErrors) {
          for (const [key, msgs] of Object.entries(fieldErrors)) {
            const field = SERVER_FIELD_MAP[key];
            if (!msgs?.length) continue;
            firstMsg ??= msgs[0];
            if (field) setError(field, { type: "server", message: msgs[0] });
          }
        }
        appToast.apiError(firstMsg || result.error || result.message || "Order failed. Please review the form.");
        return;
      }

      const gateway = paymentMethod.code;

      if (gateway === "sslcommerz") {
        const payRes = await fetch("/api/payment/sslcommerz/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: result.order.id,
            amount: result.order.net_total,
            currency: currency,
            payment_method_id: paymentMethod.id,
            customer: { name: data.name, email: data.email || undefined, phone: data.phone },
            shipping_address: {
              address: data.address,
              city: data.city,
              state: data.state,
              country: data.country,
            },
          }),
        });
        const payData = await payRes.json();
        if (payData.gateway_url) {
          await clearCart(token);
          window.location.href = payData.gateway_url;
          return;
        }
        appToast.apiError(payData.error || "Could not initiate payment. Please try again.");
        return;
      }

      if (gateway === "bkash") {
        const payRes = await fetch("/api/payment/bkash/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: result.order.id,
            amount: result.order.net_total,
            payment_method_id: paymentMethod.id,
            customer: { name: data.name, phone: data.phone },
          }),
        });
        const payData = await payRes.json();
        if (payData.bkash_url) {
          await clearCart(token);
          window.location.href = payData.bkash_url;
          return;
        }
        appToast.apiError(payData.error || "Could not initiate bKash payment.");
        return;
      }

      appToast.orderSuccess(result.order.invoice_number);
      await clearCart(token);
      router.push(
        `/order-confirmation/${result.order.id}?invoice=${result.order.invoice_number}&total=${result.order.net_total}&points=${result.order.points_earned ?? 0}`
      );
    } catch {
      appToast.apiError("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* ── Left: form sections ── */}
        <div className="space-y-6">
          <SectionCard>
            <SectionLabel>Contact Details</SectionLabel>
            <div className="space-y-4">
              <Input label="Full Name *" {...register("name")} error={errors.name?.message} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Phone *" type="tel" {...register("phone")} error={errors.phone?.message} />
                <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
              </div>
            </div>
          </SectionCard>

          <SectionCard>
            <SectionLabel>Shipping Address</SectionLabel>
            <div className="space-y-4">
              <Input label="Address *" {...register("address")} error={errors.address?.message} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="City" {...register("city")} />
                <Input label="State" {...register("state")} />
                <Input
                  label="Country"
                  {...register("country")}
                  readOnly
                  className="bg-[var(--color-surface-50,#f8fafc)] cursor-not-allowed"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard>
            <SectionLabel>Delivery Method</SectionLabel>
            <ShippingSelector
              currency={currency}
              methodName={resolveL10n(delivery?.zone_name) ?? ""}
              onChange={setDelivery}
            />
          </SectionCard>

          <SectionCard>
            <SectionLabel>Payment Method</SectionLabel>
            <PaymentSelector
              value={resolveL10n(paymentMethod?.name) ?? ""}
              onChange={setPaymentMethod}
            />
          </SectionCard>

          <SectionCard>
            <SectionLabel>Coupon Code</SectionLabel>
            <CouponInput
              orderTotal={subTotal}
              currency={currency}
              onApply={(code, amount) => {
                setCouponCode(code);
                setDiscountAmount(amount);
              }}
            />
          </SectionCard>

          <SectionCard>
            <SectionLabel>Order Notes</SectionLabel>
            <textarea
              {...register("note")}
              placeholder="Special instructions or delivery notes (optional)"
              rows={3}
              className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </SectionCard>
        </div>

        {/* ── Right: order summary ── */}
        <aside className="lg:sticky lg:top-24">
          <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6">
            <h2 className="font-display text-base font-semibold mb-4">Order Summary</h2>

            <ul className="divide-y divide-[var(--color-border)] mb-4">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border border-[var(--color-border)] bg-surface-50">
                    {item.product_image ? (
                      <Image
                        src={item.product_image}
                        alt={item.product_name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-100" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product_name}</p>
                    {(attributeOverrides[item.barcode_id] ?? []).length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {(attributeOverrides[item.barcode_id] ?? []).map((attr) => {
                          const isColor = /^#[0-9a-fA-F]{3,6}$/.test(attr.value_code ?? "");
                          return isColor ? (
                            <span
                              key={attr.name}
                              title={`${attr.name}: ${attr.value}`}
                              style={{ backgroundColor: attr.value_code }}
                              className="inline-block w-3 h-3 rounded-full border border-black/10"
                            />
                          ) : (
                            <span key={attr.name} className="text-xs text-[var(--color-text-muted)] bg-surface-100 px-1.5 py-0.5 rounded">
                              {attr.name}: {attr.value}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {formatPrice(item.unit_price || priceOverrides[item.barcode_id] || 0, currency)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold shrink-0">
                    {formatPrice(item.line_total || (item.unit_price || priceOverrides[item.barcode_id] || 0) * item.quantity, currency)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="space-y-2 text-sm border-t border-[var(--color-border)] pt-4">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Subtotal</span>
                <span>{formatPrice(subTotal, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">
                  Delivery{delivery ? ` (${resolveL10n(delivery.zone_name)})` : ""}
                </span>
                <span>
                  {delivery
                    ? shippingCost === 0
                      ? "Free"
                      : formatPrice(shippingCost, currency)
                    : "—"}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>−{formatPrice(discountAmount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-[var(--color-border)] pt-3 mt-1">
                <span>Total</span>
                <span>{formatPrice(total, currency)}</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-6"
              loading={isSubmitting}
              disabled={items.length === 0}
            >
              Place Order — {formatPrice(total, currency)}
            </Button>

            {!paymentMethod && (
              <p className="text-xs text-center text-[var(--color-text-muted)] mt-2">
                Select a payment method to continue
              </p>
            )}
          </div>
        </aside>
      </div>
    </form>
  );
}
