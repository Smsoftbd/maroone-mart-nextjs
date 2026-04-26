"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(5, "Phone is required").max(50),
  address: z.string().min(1, "Address is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  note: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CheckoutFormProps {
  currency: string;
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

export function CheckoutForm({ currency }: CheckoutFormProps) {
  const router = useRouter();
  const { items, subTotal, priceOverrides, clearCart } = useCartStore();
  const { customer, token } = useAuthStore();
  const [delivery, setDelivery] = useState<DeliveryCharge | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
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
      country: customer?.country ?? "",
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
        appToast.apiError(result.error || "Order failed.");
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
                <Input label="Country" {...register("country")} />
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
