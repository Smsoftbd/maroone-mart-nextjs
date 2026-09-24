"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShoppingBag, X } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { CartItem } from "./CartItem";
import { useCartStore } from "@/lib/stores/cartStore";
import { formatPrice } from "@/lib/utils/format";
import { useT } from "@/lib/i18n/I18nProvider";
import { useTrackViewCart } from "@/lib/hooks/useTrackViewCart";

interface CartDrawerProps {
  currency: string;
}

/**
 * Slide-over cart, in the reference storefront's shape: a green bag tile in
 * the head, one framed row per line item on a tinted body, and the total plus
 * "View Cart" / "Checkout" pinned to the bottom.
 */
export function CartDrawer({ currency }: CartDrawerProps) {
  const { isOpen, closeCart, items, totalItems, subTotal } = useCartStore();
  const router = useRouter();
  const t = useT();
  useTrackViewCart(isOpen);

  const handleClose = useCallback(() => closeCart(), [closeCart]);

  const header = (
    <div className="cart-drawer-head">
      <span className="cart-drawer-icon">
        <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <h2 className="font-display text-xl font-bold leading-tight">{t("cart", "Cart")}</h2>
        <p className="text-[13px] text-[var(--color-text-muted)] tabular-nums">
          {totalItems} {totalItems === 1 ? t("item", "item") : t("items", "items")}
        </p>
      </div>
      <button
        onClick={handleClose}
        className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text-primary)]"
        aria-label={t("close", "Close")}
      >
        <X className="h-5 w-5" strokeWidth={2} />
      </button>
    </div>
  );

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title={t("cart", "Cart")} header={header}>
      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={t("cart_empty_title", "Your cart is empty")}
          description={t("cart_empty_desc", "Add some products to get started.")}
          action={{
            label: t("start_shopping", "Start shopping"),
            onClick: () => {
              closeCart();
              router.push("/products");
            },
          }}
          className="py-20"
        />
      ) : (
        <div className="cart-drawer-body flex min-h-full flex-col">
          <div className="flex-1 p-4">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                currency={currency}
                onNavigate={closeCart}
                variant="drawer"
              />
            ))}
          </div>

          <div className="cart-foot sticky bottom-0">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xl font-bold text-[var(--color-text-primary)]">{t("total", "Total")}</p>
              <p className="cart-total-amount">{formatPrice(subTotal, currency)}</p>
            </div>
            <p className="mt-1.5 text-center text-[13px] text-[var(--color-text-muted)]">
              {t("taxes_shipping_at_checkout", "Taxes and shipping calculated at checkout")}
            </p>
            <div className="mt-4 flex gap-3">
              <Link href="/cart" onClick={closeCart} className="cart-foot-btn is-ghost flex-1">
                {t("view_cart", "View Cart")}
              </Link>
              <Link href="/checkout" onClick={closeCart} className="cart-foot-btn is-primary flex-[1.6]">
                {t("checkout", "Checkout")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
