"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Minus, Package, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { useCartStore } from "@/lib/stores/cartStore";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/lib/i18n/I18nProvider";
import type { CartItem } from "@/lib/api/types";

interface CheckoutItemProps {
  item: CartItem;
  currency: string;
  storeName: string;
}

export function CheckoutItem({ item, currency, storeName }: CheckoutItemProps) {
  const t = useT();
  const { updateItem, removeItem } = useCart();
  const priceOverrides = useCartStore((s) => s.priceOverrides);
  const stockOverrides = useCartStore((s) => s.stockOverrides);
  const attributeOverrides = useCartStore((s) => s.attributeOverrides);
  const [pending, setPending] = useState(false);

  const unit = item.unit_price || priceOverrides[item.barcode_id] || 0;
  const attrs = attributeOverrides[item.barcode_id] ?? [];
  const maxQty = stockOverrides[item.barcode_id] ?? Infinity;
  const atMin = item.quantity <= 1;
  const atMax = item.quantity >= maxQty;
  const href = `/products/${item.product_slug}`;

  const run = async (action: () => Promise<void>) => {
    if (pending) return;
    setPending(true);
    try {
      await action();
    } finally {
      setPending(false);
    }
  };

  const stepperBtn =
    "h-7 w-7 flex items-center justify-center rounded border transition-colors disabled:cursor-not-allowed disabled:border-[var(--color-border)] disabled:text-[var(--color-text-muted)]";

  return (
    <div
      className={cn(
        "relative flex gap-4 rounded-lg bg-white p-4 transition-opacity",
        pending && "opacity-60"
      )}
    >
      <Link
        href={href}
        className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-md bg-surface-100"
      >
        {item.product_image ? (
          <Image
            src={item.product_image}
            alt={item.product_name}
            fill
            className="object-cover"
            sizes="84px"
          />
        ) : (
          <Package className="absolute inset-0 m-auto h-6 w-6 text-[var(--color-text-muted)]" />
        )}
      </Link>

      <div className="flex-1 min-w-0 pr-6">
        {storeName && <p className="text-[11px] text-brand-ink leading-none mb-2">{storeName}</p>}
        <Link
          href={href}
          className="block text-[15px] font-semibold leading-snug truncate hover:text-brand-ink transition-colors"
        >
          {item.product_name}
        </Link>
        {attrs.length > 0 && (
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            {attrs.map((a) => `${a.name}: ${a.value}`).join(", ")}
          </p>
        )}
        <p className="mt-1.5 text-xl text-brand-ink tabular-nums">{formatPrice(unit, currency)}</p>

        <div className="mt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => run(() => updateItem(item.id, item.quantity - 1))}
            disabled={pending || atMin}
            aria-label={t("decrease_qty", "Decrease quantity")}
            className={cn(stepperBtn, "border-[var(--color-text-primary)] hover:bg-surface-100")}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-5 text-center text-sm tabular-nums" aria-live="polite">
            {pending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : item.quantity}
          </span>
          <button
            type="button"
            onClick={() => !atMax && run(() => updateItem(item.id, item.quantity + 1))}
            disabled={pending || atMax}
            aria-label={t("increase_qty", "Increase quantity")}
            title={atMax ? t("max_stock_reached", "Max available") : undefined}
            className={cn(stepperBtn, "border-[var(--color-text-primary)] hover:bg-surface-100")}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => run(() => removeItem(item.id))}
        disabled={pending}
        aria-label={t("remove_item", "Remove item")}
        className="absolute right-4 top-4 text-red-500 hover:text-red-600 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
