"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { formatPrice } from "@/lib/utils/format";
import { useT } from "@/lib/i18n/I18nProvider";

interface FloatingCartProps {
  currency: string;
}

/** Maroon cart tab on the right edge (tablets and up): item count over the subtotal, shown even when empty. */
export function FloatingCart({ currency }: FloatingCartProps) {
  const { totalItems, subTotal, openCart } = useCart();
  const t = useT();

  return (
    <button onClick={openCart} aria-label={`${t("cart", "Cart")} — ${totalItems}`} className="mr-floating-cart">
      <span className="mr-floating-cart-top">
        <ShoppingBag className="mx-auto h-6 w-6" strokeWidth={2} />
        <span className="block">
          {totalItems} {totalItems === 1 ? t("item", "Item") : t("items", "Items")}
        </span>
      </span>
      <span className="mr-floating-cart-total">{formatPrice(subTotal, currency)}</span>
    </button>
  );
}
