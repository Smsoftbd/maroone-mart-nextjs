"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/lib/stores/cartStore";
import { track } from "@/lib/analytics/track";
import type { MetaItem } from "@/lib/analytics/meta";
import type { CartItem } from "@/lib/api/types";

export const cartTrackItem = (i: CartItem, quantity = i.quantity): MetaItem => ({
  id: i.barcode_id,
  name: i.product_name,
  price: i.unit_price,
  quantity,
});

/** view_cart once per time the cart becomes visible with items (cart loads async). */
export function useTrackViewCart(visible: boolean) {
  const items = useCartStore((s) => s.items);
  const subTotal = useCartStore((s) => s.subTotal);
  const tracked = useRef(false);

  useEffect(() => {
    if (!visible) {
      tracked.current = false;
      return;
    }
    if (tracked.current || items.length === 0) return;
    tracked.current = true;
    track.viewCart(items.map((i) => cartTrackItem(i)), subTotal);
  }, [visible, items, subTotal]);
}
