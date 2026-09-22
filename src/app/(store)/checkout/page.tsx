import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getStore } from "@/lib/api/store";
import { getCouponAvailability } from "@/lib/api/orders";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const [store, showCoupon] = await Promise.all([getStore(), getCouponAvailability()]);

  return (
    <div className="checkout-page bg-surface min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8 md:pt-8 md:pb-16">
        <CheckoutForm
          currency={store.currency_symbol}
          country={store.country}
          storeName={store.name}
          showCoupon={showCoupon}
        />
      </div>
    </div>
  );
}
