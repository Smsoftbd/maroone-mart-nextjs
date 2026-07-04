import type { Metadata } from "next";
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-2xl font-bold mb-6">{t("checkout", "Checkout")}</h1>
      <CheckoutForm
        currency={store.currency_symbol}
        country={store.country}
        showCoupon={showCoupon}
      />
    </div>
  );
}
