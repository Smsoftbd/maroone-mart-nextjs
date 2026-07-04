import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getStore } from "@/lib/api/store";
import { getCouponAvailability } from "@/lib/api/orders";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const [store, showCoupon] = await Promise.all([
    getStore(),
    getCouponAvailability(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-2xl font-bold mb-6">Checkout</h1>
      <CheckoutForm
        currency={store.currency_symbol}
        country={store.country}
        showCoupon={showCoupon}
      />
    </div>
  );
}
