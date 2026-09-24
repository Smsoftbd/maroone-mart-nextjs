import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { HomeProductSection } from "@/components/home/FeaturedProducts";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { getStore } from "@/lib/api/store";
import { getBestSelling } from "@/lib/api/products";
import { getDeliveryCharges } from "@/lib/api/content";
import { getServerT } from "@/lib/i18n/server";
import { resolveL10n } from "@/lib/utils/l10n";

export const metadata: Metadata = { title: "Shopping Cart" };

export default async function CartPage() {
  const [store, t, zones, alsoLike] = await Promise.all([
    getStore(),
    getServerT(),
    getDeliveryCharges().catch(() => []),
    getBestSelling(10).catch(() => []),
  ]);
  const rates = zones.map((z) => ({ name: resolveL10n(z.zone_name), amount: Number(z.charge_amount) || 0 }));

  return (
    <div className="cart-page">
      <div className="max-w-7xl mx-auto pf-breadcrumb">
        <Breadcrumb items={[{ label: t("home", "Home"), href: "/" }, { label: t("shopping_cart", "Shopping Cart") }]} />
      </div>
      <div className="max-w-7xl mx-auto pt-5 pb-10">
        <CartView currency={store.currency_symbol} country={store.country || "Bangladesh"} rates={rates} />
      </div>
      <HomeProductSection
        title={t("you_may_also_like", "You May Also Like")}
        viewAllLabel={t("view_all", "View All")}
        products={alsoLike}
        currency={store.currency_symbol}
        list={{ id: "cart_also_like", name: "You may also like" }}
      />
      <div className="pb-20 max-md:pb-10" />
    </div>
  );
}
