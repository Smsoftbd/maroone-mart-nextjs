"use client";

import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { useCartStore } from "@/lib/stores/cartStore";
import { formatPrice } from "@/lib/utils/format";
import type { CartItem } from "@/lib/api/types";

interface CheckoutItemProps {
  item: CartItem;
  currency: string;
}

/** One line in the checkout's Order Summary: thumb, name, "n × price", total. */
export function CheckoutItem({ item, currency }: CheckoutItemProps) {
  const priceOverrides = useCartStore((s) => s.priceOverrides);
  const attributeOverrides = useCartStore((s) => s.attributeOverrides);

  const unit = item.unit_price || priceOverrides[item.barcode_id] || 0;
  const attrs = attributeOverrides[item.barcode_id] ?? [];
  const href = `/products/${item.product_slug}`;

  return (
    <div className="summary-row">
      <Link
        href={href}
        className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[var(--color-surface)]"
      >
        {item.product_image ? (
          <Image src={item.product_image} alt={item.product_name} fill className="object-cover" sizes="48px" />
        ) : (
          <Package className="absolute inset-0 m-auto h-5 w-5 text-[var(--color-text-muted)]" />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={href}
          className="block truncate text-sm font-bold text-[var(--color-text-primary)] transition-colors hover:text-brand-ink"
        >
          {item.product_name}
        </Link>
        <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)] tabular-nums">
          {item.quantity} x {formatPrice(unit, currency)}
          {attrs.length > 0 && ` · ${attrs.map((a) => `${a.name}: ${a.value}`).join(", ")}`}
        </p>
      </div>

      <p className="shrink-0 text-sm font-bold tabular-nums text-[var(--color-brand-500)]">
        {formatPrice(unit * item.quantity, currency)}
      </p>
    </div>
  );
}
