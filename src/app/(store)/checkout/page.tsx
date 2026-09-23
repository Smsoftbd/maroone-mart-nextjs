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
    <div className="checkout-page min-h-screen">
      <CheckoutForm
        currency={store.currency_symbol}
        country={store.country}
        showCoupon={showCoupon}
      />
    </div>
  );
}
