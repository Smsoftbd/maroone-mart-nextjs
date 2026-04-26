"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "@/lib/api/cart";
import type { CartItem } from "@/lib/api/types";

interface CartStore {
  items: CartItem[];
  cartToken: string | null;
  priceOverrides: Record<number, number>;
  stockOverrides: Record<number, number>;
  totalItems: number;
  subTotal: number;
  isLoading: boolean;
  isOpen: boolean;

  openCart: () => void;
  closeCart: () => void;
  setCartToken: (token: string) => void;
  fetchCart: (bearerToken?: string | null) => Promise<void>;
  addItem: (
    barcodeId: number,
    quantity: number,
    bearerToken?: string | null,
    unitPrice?: number,
    stock?: number
  ) => Promise<void>;
  updateItem: (
    cartItemId: number,
    quantity: number,
    bearerToken?: string | null
  ) => Promise<void>;
  removeItem: (
    cartItemId: number,
    bearerToken?: string | null
  ) => Promise<void>;
  clearCart: (bearerToken?: string | null) => Promise<void>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartToken: null,
      priceOverrides: {},
      stockOverrides: {},
      totalItems: 0,
      subTotal: 0,
      isLoading: false,
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      setCartToken: (token) => set({ cartToken: token }),

      fetchCart: async (bearerToken) => {
        const { cartToken, priceOverrides } = get();
        if (!cartToken && !bearerToken) return;
        try {
          const res = await getCart({ cartToken, bearerToken });
          const items = res.data.items;
          const subTotal = res.data.sub_total || items.reduce((sum, i) => {
            const p = priceOverrides[i.barcode_id] ?? 0;
            return sum + p * i.quantity;
          }, 0);
          set({ items, totalItems: res.data.total_items, subTotal });
        } catch {
          // silently fail — cart may not exist yet
        }
      },

      addItem: async (barcodeId, quantity, bearerToken, unitPrice, stock) => {
        const { cartToken, priceOverrides, stockOverrides } = get();
        set({ isLoading: true });
        try {
          const res = await addToCart(barcodeId, quantity, {
            cartToken,
            bearerToken,
          });
          if (res.cart_token) {
            set({ cartToken: res.cart_token });
          }
          const newPriceOverrides = unitPrice
            ? { ...priceOverrides, [barcodeId]: unitPrice }
            : priceOverrides;
          const newStockOverrides = stock !== undefined
            ? { ...stockOverrides, [barcodeId]: stock }
            : stockOverrides;
          const items = res.data.items;
          const subTotal = res.data.sub_total || items.reduce((sum, i) => {
            const p = newPriceOverrides[i.barcode_id] ?? 0;
            return sum + p * i.quantity;
          }, 0);
          set({
            items,
            totalItems: res.data.total_items,
            subTotal,
            priceOverrides: newPriceOverrides,
            stockOverrides: newStockOverrides,
            isOpen: true,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      updateItem: async (cartItemId, quantity, bearerToken) => {
        const { cartToken, priceOverrides } = get();
        set({ isLoading: true });
        try {
          const res = await updateCartItem(cartItemId, quantity, {
            cartToken,
            bearerToken,
          });
          const items = res.data.items;
          const subTotal = res.data.sub_total || items.reduce((sum, i) => {
            const p = priceOverrides[i.barcode_id] ?? 0;
            return sum + p * i.quantity;
          }, 0);
          set({ items, totalItems: res.data.total_items, subTotal });
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (cartItemId, bearerToken) => {
        const { cartToken, items, priceOverrides } = get();
        set({ items: items.filter((i) => i.id !== cartItemId) });
        try {
          const res = await removeCartItem(cartItemId, { cartToken, bearerToken });
          const newItems = res.data.items;
          const subTotal = res.data.sub_total || newItems.reduce((sum, i) => {
            const p = priceOverrides[i.barcode_id] ?? 0;
            return sum + p * i.quantity;
          }, 0);
          set({ items: newItems, totalItems: res.data.total_items, subTotal });
        } catch {
          set({ items });
        }
      },

      clearCart: async (bearerToken) => {
        const { cartToken } = get();
        set({ isLoading: true });
        try {
          await clearCart({ cartToken, bearerToken });
          set({ items: [], totalItems: 0, subTotal: 0 });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ cartToken: state.cartToken, priceOverrides: state.priceOverrides, stockOverrides: state.stockOverrides }),
    }
  )
);
