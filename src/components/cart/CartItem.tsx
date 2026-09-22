"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { useCartStore } from "@/lib/stores/cartStore";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/lib/i18n/I18nProvider";
import type { CartItem as CartItemType } from "@/lib/api/types";

interface CartItemProps {
  item: CartItemType;
  currency: string;
  onNavigate?: () => void;
}

const LOW_STOCK_THRESHOLD = 5;

export function CartItem({ item, currency, onNavigate }: CartItemProps) {
  const { updateItem, removeItem } = useCart();
  const priceOverrides = useCartStore((s) => s.priceOverrides);
  const stockOverrides = useCartStore((s) => s.stockOverrides);
  const attributeOverrides = useCartStore((s) => s.attributeOverrides);
  const attributes = attributeOverrides[item.barcode_id] ?? [];
  const t = useT();
  const [pending, setPending] = useState(false);

  const productName = item.product_name;
  const productHref = `/products/${item.product_slug}`;
  const productImage = item.product_image || null;
  const unitPrice = item.unit_price || priceOverrides[item.barcode_id] || 0;
  const lineTotal = unitPrice * item.quantity;
  const maxQty = stockOverrides[item.barcode_id] ?? Infinity;
  const atMin = item.quantity <= 1;
  const atMax = item.quantity >= maxQty;
  const lowStock = Number.isFinite(maxQty) && maxQty <= LOW_STOCK_THRESHOLD;

  const run = async (action: () => Promise<void>) => {
    if (pending) return;
    setPending(true);
    try {
      await action();
    } finally {
      setPending(false);
    }
  };

  const decrease = () =>
    run(() => (atMin ? removeItem(item.id) : updateItem(item.id, item.quantity - 1)));
  const increase = () => !atMax && run(() => updateItem(item.id, item.quantity + 1));
  const remove = () => run(() => removeItem(item.id));

  const stepperBtn =
    "w-9 h-9 flex items-center justify-center transition-colors disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)] hover:bg-brand-50 hover:text-brand-ink disabled:hover:bg-transparent";

  return (
    <div
      className={cn(
        "cart-card flex gap-3 py-4 border-b border-[var(--color-border)] last:border-b-0 transition-opacity",
        pending && "opacity-60"
      )}
    >
      <Link href={productHref} onClick={onNavigate} className="shrink-0">
        {productImage ? (
          <Image
            src={productImage}
            alt={productName}
            width={88}
            height={88}
            className="h-[88px] w-[88px] object-cover rounded-lg border border-[var(--color-border)]"
          />
        ) : (
          <div className="h-[88px] w-[88px] rounded-lg border border-[var(--color-border)] bg-surface-100 flex items-center justify-center text-xs text-[var(--color-text-muted)]">
            {t("no_image", "No image")}
          </div>
        )}
      </Link>

      <div className="flex flex-col flex-1 min-w-0 gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={productHref}
            onClick={onNavigate}
            className="product-title text-sm font-semibold text-[var(--color-text-primary)] font-body line-clamp-2 hover:text-brand-ink transition-colors"
          >
            {productName}
          </Link>
          <p className="shrink-0 font-bold text-[var(--color-text-primary)] tabular-nums">
            {formatPrice(lineTotal, currency)}
          </p>
        </div>

        {attributes.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {attributes.map((attr) => {
              const isColor = /^#[0-9a-fA-F]{3,6}$/.test(attr.value_code ?? "");
              return (
                <span
                  key={attr.name}
                  className="inline-flex items-center gap-1.5 px-2 h-6 text-xs border border-[var(--color-border)] rounded-md text-[var(--color-text-secondary)]"
                >
                  {isColor && (
                    <span
                      style={{ backgroundColor: attr.value_code }}
                      className="inline-block w-3.5 h-3.5 rounded-full border border-black/10"
                    />
                  )}
                  {attr.name}: {attr.value}
                </span>
              );
            })}
          </div>
        )}

        <p className="text-xs text-[var(--color-text-secondary)] tabular-nums">
          {formatPrice(unitPrice, currency)} {t("each", "each")}
          {lowStock && (
            <span className="ml-2 font-medium text-[var(--color-warning)]">
              {atMax
                ? t("max_stock_reached", "Max available")
                : `${t("only", "Only")} ${maxQty} ${t("left", "left")}`}
            </span>
          )}
        </p>

        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="inline-flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden text-[var(--color-text-primary)]">
            <button
              onClick={decrease}
              disabled={pending}
              aria-label={atMin ? t("remove_item", "Remove item") : t("decrease_qty", "Decrease quantity")}
              className={cn(stepperBtn, atMin && "text-red-500 hover:bg-red-50")}
            >
              {atMin ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" strokeWidth={2} />}
            </button>
            <span className="w-9 text-center font-semibold tabular-nums" aria-live="polite">
              {pending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : item.quantity}
            </span>
            <button
              onClick={increase}
              disabled={pending || atMax}
              aria-label={t("increase_qty", "Increase quantity")}
              title={atMax ? t("max_stock_reached", "Max available") : undefined}
              className={stepperBtn}
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <button
            onClick={remove}
            disabled={pending}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-text-secondary)] hover:text-red-500 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("remove", "Remove")}
          </button>
        </div>
      </div>
    </div>
  );
}
