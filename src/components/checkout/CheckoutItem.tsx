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

/** One line in the checkout summary: thumb with a quantity bubble, name, option, line total. */
export function CheckoutItem({ item, currency }: CheckoutItemProps) {
  const priceOverrides = useCartStore((s) => s.priceOverrides);
  const attributeOverrides = useCartStore((s) => s.attributeOverrides);

  const unit = item.unit_price || priceOverrides[item.barcode_id] || 0;
  const attrs = attributeOverrides[item.barcode_id] ?? [];
  const href = `/products/${item.product_slug}`;

  return (
    <div className="co-line">
      <Link href={href} className="co-line-img">
        {item.product_image ? (
          <Image src={item.product_image} alt={item.product_name} fill className="object-contain" sizes="64px" />
        ) : (
          <Package className="absolute inset-0 m-auto h-5 w-5 text-[var(--color-text-muted)]" />
        )}
        <span className="co-line-qty">{item.quantity}</span>
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={href} className="co-line-name">
          {item.product_name}
        </Link>
        {attrs.length > 0 && <p className="co-line-meta">{attrs.map((a) => a.value).join(" / ")}</p>}
      </div>
      <p className="co-line-price">{formatPrice(unit * item.quantity, currency)}</p>
    </div>
  );
}
