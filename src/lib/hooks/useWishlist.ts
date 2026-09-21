"use client";

import { useState, useEffect } from "react";
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

export function useWishlist() {
  const { token, isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWishlist = async () => {
    if (!token) return;
    try {
      const res = await getWishlist(token);
      setItems(res.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAuthenticated && token) fetchWishlist();
  }, [isAuthenticated, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const isInWishlist = (productId: number) =>
    items.some((i) => i.product_id === productId);

  const toggle = async (productSlug: string, productId: number, metaItem?: MetaItem) => {
    if (!token) {
      appToast.apiError("Please log in to use wishlist");
      return;
    }
    setIsLoading(true);
    try {
      const existing = items.find((i) => i.product_id === productId);
      if (existing) {
        await removeFromWishlist(token, existing.id);
        setItems((prev) => prev.filter((i) => i.id !== existing.id));
        appToast.wishlistRemoved();
      } else {
        const res = await addToWishlist(token, productSlug);
        setItems((prev) => [...prev, res.data]);
        appToast.wishlistAdded();
        if (metaItem) track.addToWishlist(metaItem);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : undefined;
      appToast.apiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return { items, isLoading, isInWishlist, toggle, fetchWishlist };
}
