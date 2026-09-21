"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ShippingSelector } from "./ShippingSelector";
import { PaymentSelector } from "./PaymentSelector";
import { CouponInput } from "./CouponInput";
import Link from "next/link";
import { Lock, Package, ShieldCheck, Tag } from "lucide-react";
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}

export function CheckoutForm({ currency, country, showCoupon }: CheckoutFormProps) {
  const router = useRouter();
  const t = useT();
  const { items, subTotal, priceOverrides, attributeOverrides, clearCart } = useCartStore();
  const { customer, token, isAuthenticated } = useAuthStore();
  const { authMode, guestCheckout, checkoutOtp } = useStoreConfig();
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

  // Login-required store: a login mode is active, guest checkout is disabled,
  // and the shopper is not signed in → gate checkout behind login.
  const loginRequired = authMode !== "guest_only" && !guestCheckout && !isAuthenticated;

  if (loginRequired) {
    return (
      <div className="bg-white border border-[var(--color-border)] rounded-2xl p-8 text-center max-w-md mx-auto">
        <h2 className="font-display text-lg font-semibold mb-2">
          {t("login_to_checkout", "Please sign in to checkout")}
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          {authMode === "sms_otp"
            ? t("login_to_checkout_otp", "Verify your phone number to place your order.")
            : t("login_to_checkout_email", "Sign in to your account to place your order.")}
        </p>
        <Link href="/login">
          <Button variant="primary" fullWidth>
            {t("sign_in", "Sign In")}
          </Button>
        </Link>
      </div>
    );
  }


  const itemCount = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-10 items-start">
        {/* ── Left: form ── */}
        <div className="bg-white border border-[var(--color-border)] rounded-3xl p-5 sm:p-7 space-y-7">
          <div className="space-y-4">
            <Input
              label={`${t("full_name", "Full Name")} *`}
              autoComplete="name"
              {...register("name")}
              error={errors.name?.message}
            />
            <Input
              label={`${t("phone", "Phone")} *`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              {...register("phone")}
              error={errors.phone?.message}
            />
            <Input
              label={`${t("address", "Address")} *`}
              autoComplete="street-address"
              placeholder={t("address_ph", "House, road, area")}
              {...register("address")}
              error={errors.address?.message}
            />
            <Input
              label={t("email", "Email")}
              type="email"
              autoComplete="email"
              placeholder={t("optional", "Optional")}
              {...register("email")}
              error={errors.email?.message}
            />
            <input type="hidden" {...register("city")} />
            <input type="hidden" {...register("state")} />
            <input type="hidden" {...register("country")} />
          </div>

          <Section title={t("delivery_method", "Delivery Method")}>
            <ShippingSelector
              currency={currency}
              methodName={resolveL10n(delivery?.zone_name) ?? ""}
              onChange={setDelivery}
            />
          </Section>

          <Section title={t("payment_method", "Payment Method")}>
            <PaymentSelector
              value={resolveL10n(paymentMethod?.name) ?? ""}
              onChange={setPaymentMethod}
            />
          </Section>

          <Section title={`${t("order_note", "Order Note")} (${t("optional", "Optional")})`}>
            <textarea
              {...register("note")}
              placeholder={t("order_notes_ph", "Special instructions or delivery notes (optional)")}
              rows={3}
              className="w-full border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </Section>
        </div>

        {/* ── Right: order summary ── */}
        <aside className="lg:sticky lg:top-24">
          <div className="bg-white border border-[var(--color-border)] rounded-3xl p-5 sm:p-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">{t("order_summary", "Order Summary")}</h2>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-100 text-[var(--color-text-secondary)]">
                {itemCount} {itemCount === 1 ? t("item", "item") : t("items", "items")}
              </span>
            </div>

            <ul className="divide-y divide-[var(--color-border)] max-h-80 overflow-y-auto pr-1 -mr-1 mb-4">
              {items.map((item) => {
                const unit = item.unit_price || priceOverrides[item.barcode_id] || 0;
                const attrs = attributeOverrides[item.barcode_id] ?? [];
                return (
                  <li key={item.id} className="flex gap-3 py-3 first:pt-0">
                    <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-surface-100 border border-[var(--color-border)]">
                      {item.product_image ? (
                        <Image
                          src={item.product_image}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <Package className="absolute inset-0 m-auto h-6 w-6 text-[var(--color-text-muted)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium leading-snug line-clamp-2">{item.product_name}</p>
                        <span className="text-sm font-semibold shrink-0 tabular-nums">
                          {formatPrice(item.line_total || unit * item.quantity, currency)}
                        </span>
                      </div>
                      {attrs.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-[var(--color-text-secondary)]">
                          {attrs.map((attr) => {
                            const isColor = /^#[0-9a-fA-F]{3,6}$/.test(attr.value_code ?? "");
                            return (
                              <span
                                key={attr.name}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-100"
                              >
                                {isColor && (
                                  <span
                                    style={{ backgroundColor: attr.value_code }}
                                    className="inline-block w-2.5 h-2.5 rounded-full ring-1 ring-black/10"
                                  />
                                )}
                                {attr.value}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <p className="mt-1 text-xs text-[var(--color-text-muted)] tabular-nums">
                        {item.quantity} × {formatPrice(unit, currency)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {showCoupon && (
              <div className="border-t border-[var(--color-border)] py-4">
                {!couponCode && (
                  <p className="flex items-center gap-1.5 text-sm font-medium mb-2">
                    <Tag className="h-4 w-4 text-brand-500" />
                    {t("have_coupon", "Have a coupon code?")}
                  </p>
                )}
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

            <dl className="space-y-2.5 text-sm border-t border-[var(--color-border)] pt-4">
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-secondary)]">{t("subtotal", "Subtotal")}</dt>
                <dd className="tabular-nums">{formatPrice(subTotal, currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-secondary)]">
                  {t("shipping", "Shipping")}
                  {delivery && (
                    <span className="block text-xs text-[var(--color-text-muted)]">
                      {resolveL10n(delivery.zone_name)}
                    </span>
                  )}
                </dt>
                <dd className="tabular-nums">
                  {delivery ? (
                    shippingCost === 0 ? (
                      <span className="text-green-600 font-medium">{t("free", "Free")}</span>
                    ) : (
                      formatPrice(shippingCost, currency)
                    )
                  ) : (
                    <span className="text-[var(--color-text-muted)]">{t("select_delivery", "Select delivery")}</span>
                  )}
                </dd>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <dt>
                    {t("discount", "Discount")}
                    {couponCode && <span className="ml-1 text-xs">({couponCode})</span>}
                  </dt>
                  <dd className="tabular-nums">−{formatPrice(discountAmount, currency)}</dd>
                </div>
              )}
              <div className="flex justify-between items-center rounded-2xl bg-brand-50/60 px-4 py-3.5 mt-3">
                <dt className="font-semibold">{t("total", "Total")}</dt>
                <dd className="text-2xl font-bold tabular-nums text-brand-600">{formatPrice(total, currency)}</dd>
              </div>
            </dl>

            {paymentMethod && (
              <p className="mt-4 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                <span>{t("payment_method", "Payment Method")}</span>
                <span className="font-medium text-[var(--color-text-primary)]">
                  {resolveL10n(paymentMethod.name)}
                </span>
              </p>
            )}

            <div className="hidden lg:block">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-6 rounded-xl h-13"
                loading={isSubmitting}
                disabled={items.length === 0}
              >
                <Lock className="h-4 w-4" />
                {t("place_order", "Place Order")}
              </Button>
              {!paymentMethod && (
                <p className="text-xs text-center text-[var(--color-text-muted)] mt-3">
                  {t("select_payment_method", "Select a payment method to continue")}
                </p>
              )}
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)]">
              <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
              {t("secure_checkout", "Secure checkout · Your info is safe")}
            </p>
          </div>
        </aside>
      </div>

      {/* ── Mobile: sticky pay bar ── */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-[var(--color-border)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-4 max-w-6xl mx-auto">
          <div className="min-w-0">
            <p className="text-xs text-[var(--color-text-muted)]">
              {t("total", "Total")} · {itemCount} {itemCount === 1 ? t("item", "item") : t("items", "items")}
            </p>
            <p className="text-lg font-bold tabular-nums leading-tight">{formatPrice(total, currency)}</p>
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="flex-1 rounded-xl"
            loading={isSubmitting}
            disabled={items.length === 0}
          >
            {t("place_order", "Place Order")}
          </Button>
        </div>
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
            className="w-full text-center text-sm text-[var(--color-text-secondary)] hover:text-brand-600 disabled:opacity-50"
          >
            {t("resend_code", "Resend code")}
          </button>
        </div>
      </Modal>
    </form>
  );
}
