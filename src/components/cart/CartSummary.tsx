"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";

interface CartSummaryProps {
  subTotal: number;
  currency: string;
  totalItems: number;
  onClose?: () => void;
}

export function CartSummary({
  subTotal,
  currency,
  totalItems,
  onClose,
}: CartSummaryProps) {
  return (
    <div className="border-t border-[var(--color-border)] p-5 space-y-4 bg-surface-50">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-text-secondary)]">Subtotal</span>
        <span className="font-bold text-lg">{formatPrice(subTotal, currency)}</span>
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">
        Shipping and taxes calculated at checkout.
      </p>
      <div className="flex flex-col gap-2">
        <Link
          href="/checkout"
          onClick={totalItems === 0 ? undefined : onClose}
          aria-disabled={totalItems === 0}
          className={cn(
            "inline-flex items-center justify-center gap-2 font-body font-medium px-5 py-2.5 text-sm rounded-lg w-full text-center",
            "bg-brand-500 text-white hover:bg-brand-600 active:scale-95 transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            totalItems === 0 && "opacity-50 pointer-events-none"
          )}
        >
          Proceed to Checkout
        </Link>
        <Link
          href="/cart"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-2 font-body font-medium px-5 py-2.5 text-sm rounded-lg w-full text-center border border-surface-900 text-surface-900 hover:bg-surface-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <ShoppingBag className="h-4 w-4" />
          View Cart
        </Link>
      </div>
    </div>
  );
}
