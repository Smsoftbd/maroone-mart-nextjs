"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, type Path } from "react-hook-form";
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
import { HandCoins } from "lucide-react";
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
  storeName: string;
  /** Render the Coupon Code section only when the org has a usable coupon. */
  showCoupon: boolean;
}

export function CheckoutForm({ currency, country, storeName, showCoupon }: CheckoutFormProps) {
  const router = useRouter();
  const t = useT();
  const { items, subTotal, priceOverrides, clearCart } = useCartStore();
  const { customer, token, isAuthenticated } = useAuthStore();
  const { authMode, guestCheckout, checkoutOtp } = useStoreConfig();
  const [delivery, setDelivery] = useState<DeliveryCharge | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponOpen, setCouponOpen] = useState(false);
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


  const fieldCls = (hasError: boolean) =>
    cn(
      "w-full rounded-md border bg-white px-4 py-3 text-[15px] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
      hasError ? "border-red-500" : "border-[var(--color-border-dark)]"
    );
  const bd = isBangladesh(country);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 items-start">
        {/* ── Left: customer details + payment ── */}
        <div className="lg:col-start-1 lg:row-start-1">
          <p className="text-[17px] font-medium leading-relaxed pb-4 border-b border-[var(--color-border)]">
            {t(
              "checkout_instruction",
              "To confirm your order, enter your name, address and mobile number, then click the Confirm Order button"
            )}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="checkout-name" className="text-[15px]">
                {t("your_name", "Your Name")}
              </label>
              <input
                id="checkout-name"
                autoComplete="name"
                placeholder={t("your_name_ph", "Enter your name")}
                className={fieldCls(!!errors.name)}
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="checkout-phone" className="text-[15px]">
                {t("phone_number", "Phone Number")}
              </label>
              <div
                className={cn(
                  "flex overflow-hidden rounded-md border bg-white focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent",
                  errors.phone ? "border-red-500" : "border-[var(--color-border-dark)]"
                )}
              >
                {bd && (
                  <span className="flex items-center px-2.5 text-[15px] bg-surface-100 border-r border-[var(--color-border-dark)] whitespace-nowrap">
                    (BD) +88
                  </span>
                )}
                <input
                  id="checkout-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={t("your_phone_ph", "Your mobile number")}
                  className="flex-1 min-w-0 px-3 py-3 text-[15px] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                  {...register("phone")}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <label htmlFor="checkout-address" className="text-[15px]">
              {t("your_address", "Your Address")}
            </label>
            <textarea
              id="checkout-address"
              rows={5}
              autoComplete="street-address"
              placeholder={t("your_address_ph", "Enter your full address")}
              className={fieldCls(!!errors.address)}
              {...register("address")}
            />
            {errors.address && <p className="text-xs text-red-600">{errors.address.message}</p>}
          </div>
          <input type="hidden" {...register("email")} />
          <input type="hidden" {...register("city")} />
          <input type="hidden" {...register("state")} />
          <input type="hidden" {...register("country")} />

          <div className="border-t-2 border-dashed border-[var(--color-border-dark)] mt-10 pt-8">
            <h2 className="flex items-center gap-2.5 text-xl font-bold mb-10">
              <HandCoins className="h-7 w-7 text-brand-ink" />
              {t("how_to_pay", "How would you like to pay")}
            </h2>
            <PaymentSelector
              value={resolveL10n(paymentMethod?.name) ?? ""}
              onChange={setPaymentMethod}
            />
          </div>
        </div>

        {/* ── Right: order summary ── */}
        <aside className="lg:col-start-2 lg:row-start-1 lg:row-span-2 rounded-lg bg-surface-100 p-4 sm:p-6">
          <h2 className="text-lg font-medium mb-4">{t("your_order", "Your Order")}</h2>

          <div className="space-y-4">
            {items.map((item) => (
              <CheckoutItem key={item.id} item={item} currency={currency} storeName={storeName} />
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-brand-500/25 bg-brand-500/5 px-4 py-5">
            <p className="text-[15px] text-[var(--color-text-secondary)] mb-4">
              {t("select_delivery_method", "Select delivery method")}
            </p>
            <ShippingSelector
              currency={currency}
              methodName={resolveL10n(delivery?.zone_name) ?? ""}
              onChange={setDelivery}
            />
          </div>

          <dl className="mt-2.5 rounded-lg bg-white px-4 py-5 text-[15px] space-y-3">
            <div className="flex justify-between">
              <dt>{t("subtotal", "Subtotal")}</dt>
              <dd className="tabular-nums">{formatPrice(subTotal, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t("discount", "Discount")}</dt>
              <dd className="tabular-nums text-red-500">-{formatPrice(discountAmount, currency)}</dd>
            </div>
            {showCoupon && (
              <div>
                <div className="flex justify-between items-center">
                  <dt>
                    {t("coupon_promo_discount", "Coupon/Promo Discount")}
                    {couponCode && <span className="ml-1 text-xs text-green-600">({couponCode})</span>}
                  </dt>
                  {!couponCode && (
                    <dd>
                      <button
                        type="button"
                        onClick={() => setCouponOpen((o) => !o)}
                        className="text-brand-ink underline underline-offset-4 hover:text-brand-ink"
                      >
                        {t("coupon_code", "Coupon Code")}
                      </button>
                    </dd>
                  )}
                </div>
                {(couponOpen || couponCode) && (
                  <div className="mt-3">
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
              </div>
            )}
            <div className="flex justify-between border-t border-[var(--color-border)] pt-3">
              <dt>{t("total_amount", "Total Amount")}</dt>
              <dd className="tabular-nums">{formatPrice(subTotal - discountAmount, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t("delivery_charge", "Delivery Charge")}</dt>
              <dd className="tabular-nums">
                {delivery ? formatPrice(shippingCost, currency) : "—"}
              </dd>
            </div>
            <div className="flex justify-between border-t border-[var(--color-text-primary)] pt-3 font-bold">
              <dt>{t("payable_amount", "Payable Amount")}</dt>
              <dd className="tabular-nums">{formatPrice(total, currency)}</dd>
            </div>
          </dl>
        </aside>

        <div className="lg:col-start-1 lg:row-start-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full rounded-md font-bold"
            loading={isSubmitting}
            disabled={items.length === 0}
          >
            {t("confirm_order", "Confirm Order")}
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
            className="w-full text-center text-sm text-[var(--color-text-secondary)] hover:text-brand-ink disabled:opacity-50"
          >
            {t("resend_code", "Resend code")}
          </button>
        </div>
      </Modal>
    </form>
  );
}
