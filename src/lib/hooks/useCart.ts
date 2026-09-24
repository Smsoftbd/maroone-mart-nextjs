"use client";

import { useCartStore } from "@/lib/stores/cartStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { appToast } from "@/lib/utils/toast";
import { track } from "@/lib/analytics/track";
import { cartTrackItem } from "@/lib/hooks/useTrackViewCart";
import type { Attribute } from "@/lib/api/types";

/** Bounce every header / tab-bar cart icon (effects.cart_feedback = bounce). */
function bounceCartIcons() {
  document.querySelectorAll<HTMLElement>(".cart-icon-btn").forEach((el) => {
    el.classList.remove("is-bouncing");
    void el.offsetWidth; // restart the animation
    el.classList.add("is-bouncing");
  });
}

export function useCart() {
  const store = useCartStore();
  const token = useAuthStore((s) => s.token);

  const addItem = async (
    barcodeId: number,
    quantity: number,
    productName?: string,
    unitPrice?: number,
    stock?: number,
    attributes?: Attribute[],
    /** false for buy-now flows: no drawer, toast or bounce. */
    { openDrawer = true }: { openDrawer?: boolean } = {}
  ) => {
    // Appearance effects.cart_feedback, mirrored on <body data-cart-feedback>.
    const feedback = openDrawer ? document.body.dataset.cartFeedback ?? "drawer" : "none";
    try {
      await store.addItem(barcodeId, quantity, token, unitPrice, stock, attributes, feedback === "drawer");
      if (feedback === "toast" && productName) appToast.addedToCart(productName);
      if (feedback === "bounce") bounceCartIcons();
      track.addToCart({ id: barcodeId, name: productName, price: unitPrice ?? 0, quantity });
    } catch (e) {
      const msg = e instanceof Error ? e.message : undefined;
      appToast.apiError(msg);
    }
  };

  const updateItem = async (cartItemId: number, quantity: number) => {
    const before = store.items.find((i) => i.id === cartItemId);
    try {
      await store.updateItem(cartItemId, quantity, token);
      const delta = before ? quantity - before.quantity : 0;
      if (before && delta > 0) track.addToCart(cartTrackItem(before, delta));
      if (before && delta < 0) track.removeFromCart(cartTrackItem(before, -delta));
    } catch (e) {
      const msg = e instanceof Error ? e.message : undefined;
      appToast.apiError(msg);
    }
  };

  const removeItem = async (cartItemId: number) => {
    const before = store.items.find((i) => i.id === cartItemId);
    try {
      await store.removeItem(cartItemId, token);
      if (before) track.removeFromCart(cartTrackItem(before));
      appToast.removedFromCart();
    } catch (e) {
      const msg = e instanceof Error ? e.message : undefined;
      appToast.apiError(msg);
    }
  };

  return {
    items: store.items,
    totalItems: store.totalItems,
    subTotal: store.subTotal,
    isLoading: store.isLoading,
    isOpen: store.isOpen,
    openCart: store.openCart,
    closeCart: store.closeCart,
    addItem,
    updateItem,
    removeItem,
    clearCart: () => store.clearCart(token ?? undefined),
  };
}
