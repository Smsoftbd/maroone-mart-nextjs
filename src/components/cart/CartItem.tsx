"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { formatPrice } from "@/lib/utils/format";
import type { CartItem as CartItemType } from "@/lib/api/types";

interface CartItemProps {
  item: CartItemType;
  currency: string;
}

export function CartItem({ item, currency }: CartItemProps) {
  const { updateItem, removeItem } = useCart();

  return (
    <div className="flex gap-3 py-4">
      <Link href={`/products/${item.product.slug}`} className="shrink-0">
        <Image
          src={item.product.image}
          alt={item.product.name}
          width={72}
          height={72}
          className="rounded-lg object-cover border border-[var(--color-border)]"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${item.product.slug}`}
          className="font-body text-sm font-medium line-clamp-2 hover:text-brand-500 transition-colors"
        >
          {item.product.name}
        </Link>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          {item.barcode.sku}
        </p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
            <button
              className="px-2 py-1 hover:bg-surface-100 transition-colors disabled:opacity-40"
              onClick={() => updateItem(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="px-3 py-1 text-sm font-medium tabular-nums">
              {item.quantity}
            </span>
            <button
              className="px-2 py-1 hover:bg-surface-100 transition-colors disabled:opacity-40"
              onClick={() => updateItem(item.id, item.quantity + 1)}
              disabled={item.quantity >= item.barcode.stock}
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <span className="font-bold text-sm">
            {formatPrice(item.line_total, currency)}
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
