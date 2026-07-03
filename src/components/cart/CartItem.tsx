"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { useCartStore } from "@/lib/stores/cartStore";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { CartItem as CartItemType } from "@/lib/api/types";

interface CartItemProps {
  item: CartItemType;
  currency: string;
}

export function CartItem({ item, currency }: CartItemProps) {
  const { updateItem, removeItem } = useCart();
  const priceOverrides = useCartStore((s) => s.priceOverrides);
  const stockOverrides = useCartStore((s) => s.stockOverrides);
  const attributeOverrides = useCartStore((s) => s.attributeOverrides);
  const attributes = attributeOverrides[item.barcode_id] ?? [];

  const productName = item.product_name;
  const productSlug = item.product_slug;
  const productImage = item.product_image || null;
  const unitPrice = item.unit_price || priceOverrides[item.barcode_id] || 0;
  const maxQty = stockOverrides[item.barcode_id] ?? Infinity;
  const atMin = item.quantity <= 1;
  const atMax = item.quantity >= maxQty;

  return (
    <div className="relative cart-card p-4 border-b border-[var(--color-border)] mb-3">
      {/* Remove */}
      <button
        onClick={() => removeItem(item.id)}
        aria-label="Remove item"
        className="absolute right-2 top-2 p-1 text-brand-500 hover:opacity-70 transition-opacity"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex gap-3">
        <Link href={`/products/${productSlug}`} className="shrink-0">
          {productImage ? (
            <Image
              src={productImage}
              alt={productName}
              width={80}
              height={80}
              className="h-20 w-20 object-cover rounded"
            />
          ) : (
            <div className="h-20 w-20 rounded border border-[var(--color-border)] bg-surface-100 flex items-center justify-center text-xs text-[var(--color-text-muted)]">
              No image
            </div>
          )}
        </Link>

        <div className="flex flex-col justify-between min-w-0 pr-6">
          <Link
            href={`/products/${productSlug}`}
            className="product-title text-base font-semibold text-[var(--color-text-primary)] font-body line-clamp-2 hover:text-brand-500 transition-colors"
          >
            {productName}
          </Link>
          <div className="flex gap-3 items-center mt-1">
            <h3 className="text-xl text-[var(--color-text-primary)]">
              {formatPrice(unitPrice, currency)}
            </h3>
          </div>
        </div>
      </div>

      {/* Variant pills + quantity */}
      <div className="flex items-center justify-between text-sm mt-4">
        <div className="flex items-center gap-2 flex-wrap">
          {attributes.map((attr) => {
            const isColor = /^#[0-9a-fA-F]{3,6}$/.test(attr.value_code ?? "");
            return isColor ? (
              <span
                key={attr.name}
                title={`${attr.name}: ${attr.value}`}
                style={{ backgroundColor: attr.value_code }}
                className="inline-block w-6 h-6 rounded-full border border-black/10"
              />
            ) : (
              <span
                key={attr.name}
                className="px-2 py-[1px] text-sm h-6 inline-flex items-center border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)]"
              >
                {attr.name}: {attr.value}
              </span>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-[var(--color-text-primary)]">
          <button
            onClick={() => (atMin ? removeItem(item.id) : updateItem(item.id, item.quantity - 1))}
            disabled={atMin}
            aria-label="Decrease quantity"
            className={cn(
              "bg-transparent border rounded w-7 h-7 flex items-center justify-center transition-colors",
              atMin
                ? "border-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed"
                : "border-brand-500 hover:bg-brand-50"
            )}
          >
            <Minus className="h-4 w-4" strokeWidth={2} />
          </button>
          <div className="mx-1 font-bold tabular-nums">{item.quantity}</div>
          <button
            onClick={() => !atMax && updateItem(item.id, item.quantity + 1)}
            disabled={atMax}
            aria-label="Increase quantity"
            className={cn(
              "bg-transparent border rounded w-7 h-7 flex items-center justify-center transition-colors",
              atMax
                ? "border-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed"
                : "border-brand-500 hover:bg-brand-50"
            )}
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
