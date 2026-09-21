import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getStore } from "@/lib/api/store";
import { getCouponAvailability } from "@/lib/api/orders";
import { getServerT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const [store, showCoupon, t] = await Promise.all([
    getStore(),
    getCouponAvailability(),
    getServerT(),
  ]);

  const steps = [
    { label: t("cart", "Cart"), state: "done" },
    { label: t("checkout", "Checkout"), state: "current" },
    { label: t("confirmation", "Confirmation"), state: "upcoming" },
  ] as const;

  return (
    <div className="bg-surface-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-32 lg:pb-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <Link
              href="/cart"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-brand-500 transition-colors mb-3"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back_to_cart", "Back to cart")}
            </Link>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {t("checkout", "Checkout")}
            </h1>
          </div>

          <ol className="flex items-center gap-2 text-xs font-medium">
            {steps.map((step, i) => (
              <li key={step.label} className="flex items-center gap-2">
                <span
                  className={
                    step.state === "current"
                      ? "rounded-full bg-surface-900 text-white px-3 py-1"
                      : step.state === "done"
                        ? "text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-muted)]"
                  }
                >
                  {step.label}
                </span>
                {i < steps.length - 1 && (
                  <span className="h-px w-5 bg-[var(--color-border-dark)]" aria-hidden />
                )}
              </li>
            ))}
          </ol>
        </header>

        <CheckoutForm
          currency={store.currency_symbol}
          country={store.country}
          showCoupon={showCoupon}
        />

        <p className="hidden lg:flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)] mt-10">
          <Lock className="h-3.5 w-3.5" />
          {t("secure_checkout_note", "Your information is encrypted and never shared.")}
        </p>
      </div>
    </div>
  );
}
