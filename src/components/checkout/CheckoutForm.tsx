"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
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

const STEPS = [
  "Contact",
  "Shipping",
  "Delivery",
  "Payment",
  "Coupon",
  "Review",
];

interface CheckoutFormProps {
  currency: string;
}

export function CheckoutForm({ currency }: CheckoutFormProps) {
  const router = useRouter();
  const { items, subTotal, clearCart } = useCartStore();
  const { customer, token } = useAuthStore();
  const [step, setStep] = useState(0);
  const [delivery, setDelivery] = useState<DeliveryCharge | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer?.name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      address: customer?.address || "",
      city: customer?.city || "",
      state: customer?.state || "",
      country: customer?.country || "",
    },
  });

  const shippingCost = delivery?.cost ?? 0;
  const total = subTotal + shippingCost - discountAmount;

  const onSubmit = async (data: FormData) => {
    if (!paymentMethod) {
      appToast.apiError("Please select a payment method.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: data.name, email: data.email || undefined, phone: data.phone },
          items: items.map((i) => ({ barcode_id: i.barcode_id, quantity: i.quantity })),
          shipping_address: {
            address: data.address,
            city: data.city,
            state: data.state,
            country: data.country,
          },
          payment_method: paymentMethod.name,
          coupon_code: couponCode || undefined,
          shipping_cost: shippingCost,
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
      router.push(`/order-confirmation/${result.order.id}?invoice=${result.order.invoice_number}&total=${result.order.net_total}&points=${result.points_earned}`);
    } catch {
      appToast.apiError("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1 shrink-0">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                i < step
                  ? "bg-brand-500 text-white"
                  : i === step
                  ? "bg-surface-900 text-white"
                  : "bg-surface-100 text-[var(--color-text-muted)]"
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-xs font-medium ${i === step ? "" : "text-[var(--color-text-muted)]"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-3 w-3 text-[var(--color-text-muted)]" />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 0: Contact */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold mb-4">Contact Details</h2>
            <Input label="Full Name" {...register("name")} error={errors.name?.message} />
            <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
            <Input label="Phone *" type="tel" {...register("phone")} error={errors.phone?.message} />
          </div>
        )}

        {/* Step 1: Shipping */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold mb-4">Shipping Address</h2>
            <Input label="Address *" {...register("address")} error={errors.address?.message} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="City" {...register("city")} />
              <Input label="State" {...register("state")} />
            </div>
            <Input label="Country" {...register("country")} />
          </div>
        )}

        {/* Step 2: Delivery */}
        {step === 2 && (
          <div>
            <h2 className="font-display text-xl font-semibold mb-4">Delivery Method</h2>
            <ShippingSelector
              currency={currency}
              methodName={delivery?.name ?? ""}
              onChange={setDelivery}
            />
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div>
            <h2 className="font-display text-xl font-semibold mb-4">Payment Method</h2>
            <PaymentSelector
              value={paymentMethod?.name ?? ""}
              onChange={setPaymentMethod}
            />
          </div>
        )}

        {/* Step 4: Coupon */}
        {step === 4 && (
          <div>
            <h2 className="font-display text-xl font-semibold mb-4">Coupon (Optional)</h2>
            <CouponInput
              orderTotal={subTotal}
              currency={currency}
              onApply={(code, amount) => {
                setCouponCode(code);
                setDiscountAmount(amount);
              }}
            />
            <div className="mt-4 bg-surface-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Subtotal</span>
                <span>{formatPrice(subTotal, currency)}</span>
              </div>
              {shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Shipping</span>
                  <span>{formatPrice(shippingCost, currency)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(discountAmount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-[var(--color-border)] pt-2 mt-2">
                <span>Total</span>
                <span>{formatPrice(total, currency)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div>
            <h2 className="font-display text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="bg-surface-50 rounded-xl p-4 text-sm space-y-1">
                <p className="font-medium">{getValues("name")}</p>
                <p className="text-[var(--color-text-secondary)]">{getValues("phone")}</p>
                <p className="text-[var(--color-text-secondary)]">{getValues("address")}{getValues("city") ? `, ${getValues("city")}` : ""}</p>
                <p className="text-[var(--color-text-secondary)]">Payment: {paymentMethod?.name || "Not selected"}</p>
                {delivery && <p className="text-[var(--color-text-secondary)]">Delivery: {delivery.name}</p>}
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="font-medium">{formatPrice(item.line_total, currency)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--color-border)] pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span>{formatPrice(total, currency)}</span>
              </div>
            </div>
            <textarea
              {...register("note")}
              placeholder="Order notes (optional)"
              rows={3}
              className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button type="button" variant="secondary" onClick={prevStep}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" variant="primary" className="flex-1" onClick={nextStep}>
              Continue
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={isSubmitting}
              disabled={items.length === 0}
            >
              Place Order — {formatPrice(total, currency)}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
