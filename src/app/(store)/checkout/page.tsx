import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getStore } from "@/lib/api/store";
import { getCouponAvailability } from "@/lib/api/orders";
import { getPages } from "@/lib/api/content";
import { getServerT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const [store, showCoupon, pages, t] = await Promise.all([
    getStore(),
    getCouponAvailability(),
    getPages().catch(() => []),
    getServerT(),
  ]);
  const links = [
    ...pages.map((p) => ({ href: `/pages/${p.slug}`, label: p.title })),
    { href: "/contact", label: t("contact", "Contact") },
  ];

  return (
    <div className="checkout-page min-h-screen">
      <CheckoutForm
        currency={store.currency_symbol}
        country={store.country}
        showCoupon={showCoupon}
        logo={store.logo}
        storeName={store.name}
        links={links}
      />
    </div>
  );
}
