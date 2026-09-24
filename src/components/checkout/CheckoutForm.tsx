"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ShippingSelector } from "./ShippingSelector";
import { PaymentSelector } from "./PaymentSelector";
import { CouponInput } from "./CouponInput";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { CheckoutItem } from "./CheckoutItem";
import { cn } from "@/lib/utils/cn";
import { useCartStore } from "@/lib/stores/cartStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { useStoreConfig } from "@/components/providers/StoreConfigProvider";
import { requestOtp as requestOtpApi, checkoutVerifyOtp } from "@/lib/api/customer";
import { formatPrice } from "@/lib/utils/format";
import { appToast } from "@/lib/utils/toast";
import { useT } from "@/lib/i18n/I18nProvider";
import type { DeliveryCharge, PaymentMethod } from "@/lib/api/types";
import { resolveL10n } from "@/lib/utils/l10n";
import { isBdPhone, isBangladesh } from "@/lib/utils/phone";
import type { MetaItem } from "@/lib/analytics/meta";
import { deferPurchase, setTrackingUserData, track } from "@/lib/analytics/track";
import { isOnlinePaymentGateway } from "@/lib/analytics/purchase-shared";
import { buildMetaUserData } from "@/lib/analytics/meta-shared";

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
  /** Render the Coupon Code section only when the org has a usable coupon. */
  showCoupon: boolean;
}

export function CheckoutForm({ currency, country, showCoupon }: CheckoutFormProps) {
  const router = useRouter();
  const t = useT();
  const { items, subTotal, priceOverrides, clearCart } = useCartStore();
  const { customer, token, isAuthenticated } = useAuthStore();
  const { authMode, guestCheckout, checkoutOtp } = useStoreConfig();
  const [delivery, setDelivery] = useState<DeliveryCharge | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  // Cash-on-delivery-only stores have nothing to pay at checkout, so the rail
  // drops its Payment step. Assume online payment until the list loads.
  const [hasOnlinePayment, setHasOnlinePayment] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(() => makeSchema(country), [country]);

  const {
    register,
    handleSubmit,
    setError,
    control,
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

  const metaItems = (): MetaItem[] =>
    items.map((i) => ({
      id: i.barcode_id,
      name: i.product_name,
      price: i.unit_price || priceOverrides[i.barcode_id] || 0,
      quantity: i.quantity,
    }));

  // InitiateCheckout once, as soon as the (async-loaded) cart has items.
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (checkoutTracked.current || items.length === 0) return;
    checkoutTracked.current = true;
    track.initiateCheckout(metaItems(), subTotal);
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const [paymentInfoTracked, setPaymentInfoTracked] = useState(false);

  // Store requires SMS OTP at checkout — logged-in customers are exempt.
  const requiresCheckoutOtp = checkoutOtp && !isAuthenticated;
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<FormData | null>(null);

  const sendOtp = async (phone: string) => {
    setOtpError(null);
    setOtpSending(true);
    try {
      await requestOtpApi(phone);
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : "Failed to send code");
    } finally {
      setOtpSending(false);
    }
  };

  const placeOrder = async (data: FormData) => {
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
            customer_delivery_charge: shippingCost,
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
          tracking: {
            external_id: customer?.id ? String(customer.id) : undefined,
            event_source_url: window.location.href,
            payment_gateway: paymentMethod.code,
            item_names: Object.fromEntries(items.map((i) => [String(i.barcode_id), i.product_name])),
          },
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

      // Backend saves the checkout address on a customer that had none —
      // refresh the profile so the next checkout is prefilled.
      if (token && !customer?.address?.trim()) {
        useAuthStore.getState().fetchProfile().catch(() => {});
      }

      const gateway = paymentMethod.code;

      // Browser half of Purchase (server half shares the event id). Gateway
      // orders only count once paid — fired from /payment/result instead.
      (isOnlinePaymentGateway(gateway) ? deferPurchase : track.purchase)(
        metaItems(),
        Number(result.order.net_total) || total,
        result.order.id,
        result.order.invoice_number,
        { coupon: couponCode || undefined, shipping: shippingCost, tax: 0 }
      );

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
          window.location.assign(payData.gateway_url);
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
          window.location.assign(payData.bkash_url);
          return;
        }
        appToast.apiError(payData.error || "Could not initiate bKash payment.");
        return;
      }

      appToast.orderSuccess(result.order.invoice_number);
      await clearCart(token);
      const confirmParams = new URLSearchParams({
        invoice: result.order.invoice_number,
        total: String(result.order.net_total),
        points: String(result.order.points_earned ?? 0),
      });
      if (result.order.invoice_url) confirmParams.set("invoice_url", result.order.invoice_url);
      router.push(`/order-confirmation/${result.order.id}?${confirmParams}`);
    } catch {
      appToast.apiError("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!paymentMethod) {
      appToast.apiError("Please select a payment method.");
      return;
    }
    const phone = data.phone.trim();
    setTrackingUserData(
      buildMetaUserData({
        name: data.name,
        email: data.email,
        phone,
        city: data.city,
        state: data.state,
        country: data.country || country,
        id: customer?.id,
      })
    );
    if (!paymentInfoTracked) {
      setPaymentInfoTracked(true);
      track.addPaymentInfo(metaItems(), total, paymentMethod.code);
    }
    // Gate on a modal only when the store requires it and this phone isn't verified yet.
    if (requiresCheckoutOtp && verifiedPhone !== phone) {
      setPendingData(data);
      setOtpCode("");
      setOtpError(null);
      setOtpModalOpen(true);
      void sendOtp(phone);
      return;
    }
    await placeOrder(data);
  };

  const confirmCheckoutOtp = async () => {
    if (!pendingData) return;
    const phone = pendingData.phone.trim();
    if (otpCode.trim().length < 4) {
      setOtpError(t("otp_required", "Enter the verification code"));
      return;
    }
    setOtpError(null);
    setOtpSending(true);
    try {
      await checkoutVerifyOtp(phone, otpCode.trim());
      setVerifiedPhone(phone);
      setOtpModalOpen(false);
      await placeOrder(pendingData);
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setOtpSending(false);
    }
  };

  const [watchedName, watchedPhone, watchedAddress] = useWatch({
    control,
    name: ["name", "phone", "address"],
  });

  // Login-required store: a login mode is active, guest checkout is disabled,
  // and the shopper is not signed in → gate checkout behind login.
  const loginRequired = authMode !== "guest_only" && !guestCheckout && !isAuthenticated;

  if (loginRequired) {
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

    return (
      <div className="px-4 py-12 sm:py-20">
        <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-[var(--color-border)] bg-surface shadow-sm">
          <div className="px-6 pt-10 pb-8 text-center sm:px-10">
            <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-ink ring-8 ring-brand-50/40">
              <Lock className="h-7 w-7" />
            </span>
            <h1 className="font-display text-2xl font-bold mb-2">
              {t("login_to_checkout", "Please sign in to checkout")}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {authMode === "sms_otp"
                ? t("login_to_checkout_otp", "Verify your phone number to place your order.")
                : t("login_to_checkout_email", "Sign in to your account to place your order.")}
            </p>
          </div>

          {items.length > 0 && (
            <div className="mx-6 mb-6 flex items-center gap-3 rounded-xl bg-[var(--color-surface-100)] px-4 py-3 sm:mx-10">
              <ShoppingBag className="h-5 w-5 shrink-0 text-brand-ink" />
              <p className="flex-1 text-sm text-[var(--color-text-secondary)]">
                {itemCount} {itemCount === 1 ? t("item", "item") : t("items", "items")}{" "}
                {t("in_your_cart", "in your cart")}
              </p>
              <p className="text-sm font-bold tabular-nums text-[var(--color-text-primary)]">
                {formatPrice(subTotal, currency)}
              </p>
            </div>
          )}

          <div className="space-y-3 px-6 pb-8 sm:px-10">
            <Link href="/login" className="block">
              <Button variant="primary" fullWidth>
                {t("sign_in", "Sign In")}
              </Button>
            </Link>
            {authMode === "email_password" && (
              <Link href="/register" className="block">
                <Button variant="secondary" fullWidth>
                  {t("create_account", "Create Account")}
                </Button>
              </Link>
            )}
          </div>

          <div className="border-t border-[var(--color-border)] px-6 py-4 text-center">
            <Link
              href="/cart"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-brand-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back_to_cart", "Back to cart")}
            </Link>
          </div>
        </div>
      </div>
    );
  }


  const bd = isBangladesh(country);
  const steps = [
    t("shipping", "Shipping"),
    ...(hasOnlinePayment ? [t("payment", "Payment")] : []),
    t("success", "Success"),
  ].map((label, i) => ({ n: i + 1, label }));
  // The rail follows how far the shopper has actually got, so it opens on
  // "Shipping" rather than jumping ahead to the auto-selected defaults.
  // Without a Payment step, Shipping stays active until the order is placed.
  const addressDone = !!watchedName?.trim() && !!watchedPhone?.trim() && (watchedAddress?.trim().length ?? 0) >= 10;
  const activeStep = addressDone && hasOnlinePayment ? 2 : 1;
  const stepDone = (n: number) => n < activeStep || (n === 1 && addressDone);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Dark hero with the step rail. */}
      <div className="checkout-hero">
        <div className="max-w-7xl mx-auto flex flex-col items-start justify-between gap-8 py-10 lg:flex-row lg:items-center lg:py-14">
          <div>
            <span className="checkout-eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
              {t("checkout_now", "Checkout Now")}
            </span>
            <h1 className="mt-4 font-display text-[34px] font-bold leading-tight text-white sm:text-[44px]">
              {t("secure_checkout", "Secure Checkout")}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#94a3b8]">
              {t("checkout_subtitle", "Complete your order in a few steps")}
              <span aria-hidden>·</span>
              <Link href="/cart" className="inline-flex items-center gap-2 font-medium text-white hover:opacity-80">
                <ArrowLeft className="h-4 w-4" />
                {t("back_to_cart", "Back to Cart")}
              </Link>
            </p>
          </div>

          <ol className="checkout-steps w-full max-w-xl lg:w-auto">
            {steps.map((s, i) => (
              <Fragment key={s.n}>
                {i > 0 && <li className={cn("checkout-step-line", stepDone(s.n - 1) && "is-done")} aria-hidden />}
                <li className={cn("checkout-step", activeStep === s.n && "is-active")}>
                  <span className="checkout-step-dot">{s.n}</span>
                  <span className="checkout-step-label">{s.label}</span>
                </li>
              </Fragment>
            ))}
          </ol>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 md:py-12">
        <div className="checkout-note mb-6">
          {t(
            "checkout_instruction",
            "To confirm your order, enter your name, address and mobile number, then place the order."
          )}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* ── Left: address, delivery, payment ── */}
          <div>
            <section className="checkout-card">
              <div className="checkout-card-head">
                <span className="checkout-tile bg-[color-mix(in_srgb,var(--color-brand-500)_12%,transparent)] text-[var(--color-brand-500)]">
                  <MapPin className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h2>{t("shipping_address", "Shipping Address")}</h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="checkout-field">
                  <label htmlFor="checkout-name">
                    {t("full_name", "Full Name")} <span className="req">*</span>
                  </label>
                  <input
                    id="checkout-name"
                    autoComplete="name"
                    placeholder={t("full_name", "Full Name")}
                    className={cn("checkout-input", errors.name && "has-error")}
                    {...register("name")}
                  />
                  {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>}
                </div>

                <div className="checkout-field">
                  <label htmlFor="checkout-phone">
                    {t("phone_number", "Phone Number")} <span className="req">*</span>
                  </label>
                  <div
                    className={cn(
                      "checkout-input flex items-center gap-2 !py-0",
                      errors.phone && "has-error"
                    )}
                  >
                    {bd && (
                      <span className="shrink-0 border-r border-[var(--color-border)] pr-2 text-sm text-[var(--color-text-secondary)]">
                        (BD) +88
                      </span>
                    )}
                    <input
                      id="checkout-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder={t("phone_number", "Phone Number")}
                      className="min-h-[44px] w-full min-w-0 bg-transparent text-sm outline-none"
                      {...register("phone")}
                    />
                  </div>
                  {errors.phone && <p className="mt-1.5 text-xs text-red-600">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="checkout-field mt-5">
                <label htmlFor="checkout-address">
                  {t("full_address", "Full Address")} <span className="req">*</span>
                </label>
                <input
                  id="checkout-address"
                  autoComplete="street-address"
                  placeholder={t("your_address_ph", "Enter your full address")}
                  className={cn("checkout-input", errors.address && "has-error")}
                  {...register("address")}
                />
                {errors.address && <p className="mt-1.5 text-xs text-red-600">{errors.address.message}</p>}
              </div>

              <div className="checkout-field mt-5">
                <label htmlFor="checkout-note">
                  {t("order_note", "Write your any note or any instruction")}{" "}
                  <span className="font-normal text-[var(--color-text-muted)]">({t("optional", "Optional")})</span>
                </label>
                <input
                  id="checkout-note"
                  className="checkout-input"
                  {...register("note")}
                />
              </div>

              <input type="hidden" {...register("email")} />
              <input type="hidden" {...register("city")} />
              <input type="hidden" {...register("state")} />
              <input type="hidden" {...register("country")} />
            </section>

            <section className="checkout-card">
              <div className="checkout-card-head">
                <span className="checkout-tile bg-[#e6fbf5] text-[#0d9488]">
                  <Truck className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h2>{t("delivery_zone_schedule", "Delivery Zone & Schedule")}</h2>
              </div>
              <p className="mb-3 text-[13px] font-semibold text-[var(--color-form-label,var(--color-text-secondary))]">
                {t("delivery_area", "Delivery Area")}
              </p>
              <ShippingSelector
                currency={currency}
                methodName={resolveL10n(delivery?.zone_name) ?? ""}
                onChange={setDelivery}
              />
            </section>

            <section className="checkout-card">
              <div className="checkout-card-head">
                <span className="checkout-tile bg-[#eef2ff] text-[#4f46e5]">
                  <CreditCard className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h2>{t("payment_method", "Payment Method")}</h2>
              </div>
              <PaymentSelector
                value={resolveL10n(paymentMethod?.name) ?? ""}
                onChange={setPaymentMethod}
                onLoad={(methods) => setHasOnlinePayment(methods.some((m) => isOnlinePaymentGateway(m.code)))}
              />
            </section>
          </div>

          {/* ── Right: order summary ── */}
          <aside className="checkout-card lg:sticky lg:top-24">
            <div className="checkout-card-head">
              <span className="checkout-tile bg-[#f5f0ff] text-[#7c3aed]">
                <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h2>{t("order_summary", "Order Summary")}</h2>
            </div>

            <div>
              {items.map((item) => (
                <CheckoutItem key={item.id} item={item} currency={currency} />
              ))}
            </div>

            <dl className="mt-5 space-y-3 border-t border-[var(--color-border)] pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-secondary)]">{t("subtotal", "Subtotal")}</dt>
                <dd className="font-semibold tabular-nums">{formatPrice(subTotal, currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-secondary)]">{t("shipping", "Shipping")}</dt>
                <dd className="font-semibold tabular-nums">
                  {delivery ? formatPrice(shippingCost, currency) : formatPrice(0, currency)}
                </dd>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text-secondary)]">
                    {t("discount", "Discount")}
                    {couponCode && <span className="ml-1 text-xs text-[var(--color-brand-500)]">({couponCode})</span>}
                  </dt>
                  <dd className="font-semibold tabular-nums text-red-600">
                    -{formatPrice(discountAmount, currency)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-secondary)]">{t("tax", "Tax")}</dt>
                <dd className="font-semibold tabular-nums">{formatPrice(0, currency)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-[var(--color-border)] pt-4">
                <dt className="text-base font-bold">{t("total", "Total")}</dt>
                <dd className="summary-total">{formatPrice(total, currency)}</dd>
              </div>
            </dl>

            {showCoupon && (
              <div className="mt-5">
                <CouponInput
                  orderTotal={subTotal}
                  currency={currency}
                  onApply={(code, amount) => {
                    setCouponCode(code);
                    setDiscountAmount(amount);
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="place-order-btn mt-5"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Lock className="h-[18px] w-[18px]" strokeWidth={2} />
              )}
              {t("place_order", "Place Order")}
            </button>

            <p className="mt-3 text-center text-xs text-[var(--color-text-muted)]">
              {t("by_placing_order", "By placing order, you agree to our")}{" "}
              <Link href="/pages/terms-and-conditions" className="font-medium text-[var(--color-brand-500)]">
                {t("terms", "Terms")}
              </Link>{" "}
              &amp;{" "}
              <Link href="/pages/privacy-policy" className="font-medium text-[var(--color-brand-500)]">
                {t("privacy", "Privacy")}
              </Link>
            </p>
          </aside>
        </div>
      </div>

      {/* Phones: payable total + place order, pinned to the bottom. */}
      <div className="checkout-bar fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 border-t border-[var(--color-border)] bg-[var(--color-surface-0)] px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] lg:hidden">
        <div className="shrink-0 leading-tight">
          <p className="text-[13px] text-[var(--color-text-secondary)]">{t("total", "Total")}</p>
          <p className="text-[17px] font-bold tabular-nums text-[var(--color-brand-500)]">
            {formatPrice(total, currency)}
          </p>
        </div>
        <button
          type="submit"
          disabled={isSubmitting || items.length === 0}
          className="place-order-btn flex-1"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Lock className="h-[18px] w-[18px]" strokeWidth={2} />
          )}
          {t("place_order", "Place Order")}
        </button>
      </div>


      <Modal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        title={t("verify_your_phone", "Verify your phone")}
        className="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t("otp_sent_to", "We sent a code to")}{" "}
            <span className="font-medium text-[var(--color-text-primary)]">{pendingData?.phone}</span>
          </p>
          <Input
            label={t("verification_code", "Verification Code")}
            inputMode="numeric"
            autoFocus
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            error={otpError ?? undefined}
          />
          <Button
            type="button"
            variant="primary"
            fullWidth
            loading={otpSending || isSubmitting}
            onClick={confirmCheckoutOtp}
          >
            {t("verify_and_place_order", "Verify & Place Order")}
          </Button>
          <button
            type="button"
            disabled={otpSending}
            onClick={() => pendingData && sendOtp(pendingData.phone.trim())}
            className="w-full text-center text-sm text-[var(--color-text-secondary)] hover:text-brand-ink disabled:opacity-50"
          >
            {t("resend_code", "Resend code")}
          </button>
        </div>
      </Modal>
    </form>
  );
}
