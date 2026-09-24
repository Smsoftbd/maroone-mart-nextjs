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
import Image from "next/image";
import { ArrowLeft, Loader2, Lock, ShoppingBag } from "lucide-react";
import { CART_NOTE_KEY } from "@/components/cart/CartView";
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
  logo?: string;
  storeName: string;
  /** Policy / contact links under the "Complete order" button. */
  links?: { href: string; label: string }[];
}

export function CheckoutForm({ currency, country, showCoupon, logo, storeName, links = [] }: CheckoutFormProps) {
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
    setValue,
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

  // The cart page's "Additional comments" become the order note.
  useEffect(() => {
    try {
      const note = localStorage.getItem(CART_NOTE_KEY);
      if (note) setValue("note", note);
    } catch {}
  }, [setValue]);

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
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const fieldError = (msg?: string) => msg && <p className="co-error">{msg}</p>;

  const summary = (
    <>
      <div className="co-lines">
        {items.map((item) => (
          <CheckoutItem key={item.id} item={item} currency={currency} />
        ))}
      </div>

      {showCoupon && (
        <div className="co-coupon">
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

      <dl className="co-totals">
        <div>
          <dt>
            {t("subtotal", "Subtotal")} · {itemCount} {itemCount === 1 ? t("item", "item") : t("items", "items")}
          </dt>
          <dd>{formatPrice(subTotal, currency)}</dd>
        </div>
        <div>
          <dt>{t("shipping", "Shipping")}</dt>
          <dd>{delivery ? formatPrice(shippingCost, currency) : t("enter_address", "Enter shipping address")}</dd>
        </div>
        {discountAmount > 0 && (
          <div>
            <dt>
              {t("discount", "Discount")}
              {couponCode && <span className="ml-1 text-xs">({couponCode})</span>}
            </dt>
            <dd>-{formatPrice(discountAmount, currency)}</dd>
          </div>
        )}
        <div className="co-total">
          <dt>{t("total", "Total")}</dt>
          <dd>
            <span className="co-currency">{currency === "৳" ? "BDT" : ""}</span>
            {formatPrice(total, currency)}
          </dd>
        </div>
      </dl>
    </>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="co-form">
      {/* Checkout's own header: logo on a soft brand banner, bag icon back to the cart. */}
      <header className="co-header">
        <div className="co-header-inner">
          <Link href="/" className="co-logo" aria-label={storeName}>
            {logo ? (
              <Image src={logo} alt={storeName} width={180} height={56} className="h-9 w-auto object-contain" priority />
            ) : (
              <span className="text-xl font-semibold">{storeName}</span>
            )}
          </Link>
          <Link href="/cart" className="co-bag" aria-label={t("back_to_cart", "Back to cart")}>
            <ShoppingBag className="h-6 w-6" strokeWidth={1.5} />
          </Link>
        </div>
      </header>

      <div className="co-grid">
        {/* Phones: collapsible order summary above the form. */}
        <details className="co-summary-toggle lg:hidden">
          <summary>
            <span className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
              {t("order_summary", "Order summary")}
            </span>
            <strong>{formatPrice(total, currency)}</strong>
          </summary>
          <div className="co-summary-body">{summary}</div>
        </details>

        <div className="co-main">
          <div className="co-main-inner">
            <section className="co-section">
              <div className="co-section-head">
                <h2>{t("contact", "Contact")}</h2>
                {authMode !== "guest_only" && !isAuthenticated && (
                  <Link href="/login" className="co-link">
                    {t("sign_in", "Sign in")}
                  </Link>
                )}
              </div>
              <div className="co-field">
                <input
                  id="checkout-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("email_optional", "Email (optional)")}
                  className={cn("co-input", errors.email && "has-error")}
                  {...register("email")}
                />
                {fieldError(errors.email?.message)}
              </div>
            </section>

            <section className="co-section">
              <h2>{t("delivery", "Delivery")}</h2>
              <div className="co-field co-select">
                <span className="co-float">{t("country_region", "Country/Region")}</span>
                <span className="co-select-value">{country}</span>
              </div>
              <div className="co-field">
                <input
                  id="checkout-name"
                  autoComplete="name"
                  placeholder={t("full_name", "Full name")}
                  aria-label={t("full_name", "Full name")}
                  className={cn("co-input", errors.name && "has-error")}
                  {...register("name")}
                />
                {fieldError(errors.name?.message)}
              </div>
              <div className="co-field">
                <input
                  id="checkout-address"
                  autoComplete="street-address"
                  placeholder={t("address", "Address")}
                  aria-label={t("address", "Address")}
                  className={cn("co-input", errors.address && "has-error")}
                  {...register("address")}
                />
                {fieldError(errors.address?.message)}
              </div>
              <div className="co-row">
                <div className="co-field">
                  <input
                    id="checkout-city"
                    autoComplete="address-level2"
                    placeholder={t("city_optional", "City (optional)")}
                    aria-label={t("city", "City")}
                    className="co-input"
                    {...register("city")}
                  />
                </div>
                <div className="co-field">
                  <input
                    id="checkout-state"
                    autoComplete="address-level1"
                    placeholder={t("area_optional", "Area (optional)")}
                    aria-label={t("area", "Area")}
                    className="co-input"
                    {...register("state")}
                  />
                </div>
              </div>
              <div className="co-field">
                <div className={cn("co-input co-phone", errors.phone && "has-error")}>
                  {bd && <span className="co-phone-prefix">+88</span>}
                  <input
                    id="checkout-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder={t("phone", "Phone")}
                    aria-label={t("phone", "Phone")}
                    {...register("phone")}
                  />
                </div>
                {fieldError(errors.phone?.message)}
              </div>
              <div className="co-field">
                <input
                  id="checkout-note"
                  placeholder={t("order_note_optional", "Order note (optional)")}
                  aria-label={t("order_note", "Order note")}
                  className="co-input"
                  {...register("note")}
                />
              </div>
              <input type="hidden" {...register("country")} />
            </section>

            <section className="co-section">
              <h3>{t("shipping_method", "Shipping method")}</h3>
              <ShippingSelector
                currency={currency}
                methodName={resolveL10n(delivery?.zone_name) ?? ""}
                onChange={setDelivery}
              />
            </section>

            <section className="co-section">
              <h2>{t("payment", "Payment")}</h2>
              <p className="co-sub">{t("transactions_secure", "All transactions are secure and encrypted.")}</p>
              <PaymentSelector
                value={resolveL10n(paymentMethod?.name) ?? ""}
                onChange={setPaymentMethod}
                onLoad={(methods) => setHasOnlinePayment(methods.some((m) => isOnlinePaymentGateway(m.code)))}
              />
            </section>

            <button type="submit" disabled={isSubmitting || items.length === 0} className="co-submit">
              {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
              {hasOnlinePayment && paymentMethod && isOnlinePaymentGateway(paymentMethod.code)
                ? t("pay_now", "Pay now")
                : t("complete_order", "Complete order")}
            </button>

            {links.length > 0 && (
              <nav className="co-footer-links" aria-label={t("policies", "Policies")}>
                {links.map((l) => (
                  <Link key={l.href} href={l.href}>
                    {l.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>

        <aside className="co-aside max-lg:hidden">
          <div className="co-aside-inner">{summary}</div>
        </aside>
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
