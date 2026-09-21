"use client";

import { useCartStore } from "@/lib/stores/cartStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { appToast } from "@/lib/utils/toast";
import type { Attribute } from "@/lib/api/types";

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
    { openDrawer = true }: { openDrawer?: boolean } = {}
  ) => {
    try {
      await store.addItem(barcodeId, quantity, token, unitPrice, stock, attributes, openDrawer);
      if (productName) appToast.addedToCart(productName);
    } catch (e) {
      const msg = e instanceof Error ? e.message : undefined;
      appToast.apiError(msg);
    }
  };

  const updateItem = async (cartItemId: number, quantity: number) => {
    try {
      await store.updateItem(cartItemId, quantity, token);
    } catch (e) {
      const msg = e instanceof Error ? e.message : undefined;
      appToast.apiError(msg);
    }
  };

  const removeItem = async (cartItemId: number) => {
    try {
      await store.removeItem(cartItemId, token);
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
