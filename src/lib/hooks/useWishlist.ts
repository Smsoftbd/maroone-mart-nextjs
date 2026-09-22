"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "@/lib/api/customer";
import { appToast } from "@/lib/utils/toast";
import type { MetaItem } from "@/lib/analytics/meta";
import { track } from "@/lib/analytics/track";
import type { WishlistItem } from "@/lib/api/types";

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  /** Token the items were loaded for; one fetch is shared by every consumer. */
  loadedFor: string | null;
  load: (token: string, force?: boolean) => Promise<void>;
}

const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  isLoading: false,
  loadedFor: null,
  load: async (token, force = false) => {
    if (!force && get().loadedFor === token) return;
    set({ loadedFor: token });
    try {
      const res = await getWishlist(token);
      set({ items: res.data });
    } catch {
      // ignore
    }
  },
}));

export function useWishlist() {
  const { token, isAuthenticated } = useAuthStore();
  const { items, isLoading, load } = useWishlistStore();

  useEffect(() => {
    if (isAuthenticated && token) load(token);
    else if (useWishlistStore.getState().loadedFor) useWishlistStore.setState({ items: [], loadedFor: null });
  }, [isAuthenticated, token, load]);

  const fetchWishlist = async () => {
    if (token) await load(token, true);
  };

  const isInWishlist = (productId: number) =>
    items.some((i) => i.product_id === productId);

  const toggle = async (productSlug: string, productId: number, metaItem?: MetaItem) => {
    if (!token) {
      appToast.apiError("Please log in to use wishlist");
      return;
    }
    useWishlistStore.setState({ isLoading: true });
    try {
      const existing = items.find((i) => i.product_id === productId);
      if (existing) {
        await removeFromWishlist(token, existing.id);
        useWishlistStore.setState((s) => ({ items: s.items.filter((i) => i.id !== existing.id) }));
        appToast.wishlistRemoved();
      } else {
        const res = await addToWishlist(token, productSlug);
        useWishlistStore.setState((s) => ({ items: [...s.items, res.data] }));
        appToast.wishlistAdded();
        if (metaItem) track.addToWishlist(metaItem);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : undefined;
      appToast.apiError(msg);
    } finally {
      useWishlistStore.setState({ isLoading: false });
    }
  };

  return { items, isLoading, isInWishlist, toggle, fetchWishlist };
}
