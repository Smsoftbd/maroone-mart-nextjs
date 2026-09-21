"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { track, type ItemList, type TrackItem } from "@/lib/analytics/track";
import type { Product } from "@/lib/api/types";

/** GA4 item for a product card: default variant's barcode id, like view_item/add_to_cart. */
export function productTrackItem(product: Product, list?: ItemList, index?: number): TrackItem {
  const barcode = product.barcodes.find((b) => b.is_active) ?? product.barcodes[0];
  return {
    id: barcode?.id ?? product.id,
    name: product.name,
    price: Math.max(barcode?.effective_price ?? 0, 0),
    quantity: 1,
    ...(list && { listId: list.id, listName: list.name }),
    ...(index !== undefined && { index }),
  };
}

type ItemListContextValue = { list: ItemList; products: Product[] };

const ItemListContext = createContext<ItemListContextValue | null>(null);

/** For ProductCard: fires select_item when the card's product link is clicked inside a tracked list. */
export function useSelectItem(product: Product) {
  const ctx = useContext(ItemListContext);
  return () => {
    if (!ctx) return;
    const index = ctx.products.findIndex((p) => p.id === product.id);
    track.selectItem(ctx.list, productTrackItem(product, ctx.list, index >= 0 ? index : undefined));
  };
}

/**
 * Wraps a product grid/carousel: view_item_list once when it first scrolls
 * into view, and list context for select_item on its cards.
 */
export function ItemListTracker({
  list,
  products,
  children,
}: {
  list: ItemList;
  products: Product[];
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seenKey = useRef<string | null>(null);
  const key = `${list.id}|${products.map((p) => p.id).join(",")}`;

  useEffect(() => {
    const el = ref.current;
    if (!el || products.length === 0 || seenKey.current === key) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        seenKey.current = key;
        track.viewItemList(
          list,
          products.map((p, i) => productTrackItem(p, list, i))
        );
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ItemListContext.Provider value={{ list, products }}>
      <div ref={ref}>{children}</div>
    </ItemListContext.Provider>
  );
}
