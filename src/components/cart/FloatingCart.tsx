"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { formatPrice } from "@/lib/utils/format";

interface FloatingCartProps {
  currency: string;
}

export function FloatingCart({ currency }: FloatingCartProps) {
  const { totalItems, subTotal, openCart } = useCart();

  if (totalItems <= 0) return null;

  return (
    <button
      onClick={openCart}
      aria-label={`Open cart, ${totalItems} items`}
      className="cart fixed top-1/2 -translate-y-1/2 mt-16 md:mt-0 right-0 z-30 rounded-s-md overflow-hidden shadow-lg bg-brand-500 text-[var(--color-primary-text)] border border-brand-500 active:scale-95 transition-transform"
    >
      <div className="p-2 pb-1 text-center">
        <ShoppingBag className="mx-auto h-7 w-7" strokeWidth={2} />
        <p className="text-xs mt-1 font-medium">
          {totalItems} {totalItems === 1 ? "ITEM" : "ITEMS"}
        </p>
      </div>
      <hr className="border-[var(--color-primary-text)]/20" />
      <div className="text-center p-2">
        <div className="text-sm font-semibold">
          {formatPrice(subTotal, currency)}
        </div>
      </div>
    </button>
  );
}
