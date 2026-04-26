"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { useCartStore } from "@/lib/stores/cartStore";
import { formatPrice } from "@/lib/utils/format";
import type { CartItem as CartItemType } from "@/lib/api/types";

interface CartItemProps {
  item: CartItemType;
  currency: string;
}

export function CartItem({ item, currency }: CartItemProps) {
  const { updateItem, removeItem } = useCart();
  const priceOverrides = useCartStore((s) => s.priceOverrides);
  const stockOverrides = useCartStore((s) => s.stockOverrides);

  const productName = item.product_name;
  const productSlug = item.product_slug;
  const productImage = item.product_image || null;
  const unitPrice = item.unit_price || priceOverrides[item.barcode_id] || 0;
  const lineTotal = item.line_total || unitPrice * item.quantity;
  const maxQty = stockOverrides[item.barcode_id] ?? Infinity;

  const handleDecrease = () => {
    if (item.quantity <= 1) {
      removeItem(item.id);
    } else {
      updateItem(item.id, item.quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (item.quantity >= maxQty) return;
    updateItem(item.id, item.quantity + 1);
  };

  return (
    <div className="flex gap-3 py-4">
      <Link href={`/products/${productSlug}`} className="shrink-0">
        {productImage ? (
          <Image
            src={productImage}
            alt={productName}
            width={72}
            height={72}
            className="rounded-lg object-cover border border-[var(--color-border)]"
          />
        ) : (
          <div className="w-[72px] h-[72px] rounded-lg border border-[var(--color-border)] bg-surface-100 flex items-center justify-center text-xs text-[var(--color-text-muted)]">
            No image
          </div>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${productSlug}`}
          className="font-body text-sm font-medium line-clamp-2 hover:text-brand-500 transition-colors"
        >
          {productName}
        </Link>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          {formatPrice(unitPrice, currency)} each
        </p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
            <button
              className="px-2 py-1 hover:bg-surface-100 transition-colors disabled:opacity-40"
              onClick={handleDecrease}
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="px-3 py-1 text-sm font-medium tabular-nums">
              {item.quantity}
            </span>
            <button
              className="px-2 py-1 hover:bg-surface-100 transition-colors disabled:opacity-40"
              onClick={handleIncrease}
              disabled={item.quantity >= maxQty}
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <span className="font-bold text-sm">
            {formatPrice(lineTotal, currency)}
          </span>
        </div>
      </div>
      <button
        onClick={() => removeItem(item.id)}
        className="shrink-0 self-start p-1.5 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
        aria-label="Remove item"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
