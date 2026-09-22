"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { useCartStore } from "@/lib/stores/cartStore";
import { useCart } from "@/lib/hooks/useCart";
import { useT } from "@/lib/i18n/I18nProvider";
import { appToast } from "@/lib/utils/toast";
import { track } from "@/lib/analytics/track";
import { cartTrackItem, useTrackViewCart } from "@/lib/hooks/useTrackViewCart";

interface CartDrawerProps {
  currency: string;
}

export function CartDrawer({ currency }: CartDrawerProps) {
  const { isOpen, closeCart, items, totalItems, subTotal } = useCartStore();
  const { clearCart } = useCart();
  const router = useRouter();
  const t = useT();
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  useTrackViewCart(isOpen);

  const handleClose = useCallback(() => {
    setConfirmClear(false);
    closeCart();
  }, [closeCart]);

  const handleClear = async () => {
    setClearing(true);
    const cleared = items;
    try {
      await clearCart();
      cleared.forEach((i) => track.removeFromCart(cartTrackItem(i)));
    } catch (e) {
      appToast.apiError(e instanceof Error ? e.message : undefined);
    } finally {
      setClearing(false);
      setConfirmClear(false);
    }
  };

  const title =
    totalItems > 0
      ? `${t("your_cart", "Your cart")} (${totalItems})`
      : t("your_cart", "Your cart");

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
    >
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
        <div className="flex flex-col min-h-full">
          <div className="flex items-center justify-end gap-2 px-4 pt-3 text-xs">
            {confirmClear ? (
              <>
                <span className="text-[var(--color-text-secondary)]">
                  {t("clear_cart_confirm", "Remove all items?")}
                </span>
                <button
                  onClick={() => setConfirmClear(false)}
                  disabled={clearing}
                  className="px-2 py-1 rounded-md font-medium text-[var(--color-text-secondary)] hover:bg-surface-100 transition-colors"
                >
                  {t("cancel", "Cancel")}
                </button>
                <button
                  onClick={handleClear}
                  disabled={clearing}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium text-[var(--color-status-error-text,#fff)] bg-red-500 hover:opacity-90 transition-colors disabled:opacity-60"
                >
                  {clearing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {t("clear", "Clear")}
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("clear_cart", "Clear cart")}
              </button>
            )}
          </div>
          <div className="flex-1 px-4">
            {items.map((item) => (
              <CartItem key={item.id} item={item} currency={currency} onNavigate={closeCart} />
            ))}
          </div>
          <div className="sticky bottom-0 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
            <CartSummary
              subTotal={subTotal}
              currency={currency}
              totalItems={totalItems}
              onClose={closeCart}
            />
          </div>
        </div>
      )}
    </Drawer>
  );
}
