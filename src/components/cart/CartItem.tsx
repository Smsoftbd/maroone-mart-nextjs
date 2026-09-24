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
  /** "drawer" = the compact row used in the slide-over cart. */
  variant?: "page" | "drawer";
}

export function CartItem(props: CartItemProps) {
  return props.variant === "drawer" ? <CartDrawerRow {...props} /> : <CartPageRow {...props} />;
}

/** Slide-over cart row: photo, name, stepper, line total and a trash tile. */
function CartDrawerRow({ item, currency, onNavigate }: CartItemProps) {
  const { updateItem, removeItem } = useCart();
  const priceOverrides = useCartStore((s) => s.priceOverrides);
  const stockOverrides = useCartStore((s) => s.stockOverrides);
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

  return (
    <div className={cn("cart-row", pending && "opacity-60")}>
      <Link href={productHref} onClick={onNavigate} className="shrink-0">
        {productImage ? (
          <Image
            src={productImage}
            alt={productName}
            width={70}
            height={70}
            className="h-[70px] w-[70px] rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-[70px] w-[70px] items-center justify-center rounded-lg bg-surface-100 text-xs text-[var(--color-text-muted)]">
            {t("no_image", "No image")}
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <Link
          href={productHref}
          onClick={onNavigate}
          className="line-clamp-2 text-sm font-bold text-[var(--color-text-primary)] transition-colors hover:text-brand-ink"
        >
          {productName}
        </Link>

        <div className="flex items-center gap-3">
          <div className="cart-qty">
            <button
              onClick={decrease}
              disabled={pending}
              aria-label={atMin ? t("remove_item", "Remove item") : t("decrease_qty", "Decrease quantity")}
            >
              <Minus className="h-4 w-4" strokeWidth={2} />
            </button>
            <span aria-live="polite">
              {pending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : item.quantity}
            </span>
            <button
              onClick={increase}
              disabled={pending || atMax}
              aria-label={t("increase_qty", "Increase quantity")}
              title={atMax ? t("max_stock_reached", "Max available") : undefined}
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <p className="ml-auto whitespace-nowrap text-base font-bold tabular-nums text-[var(--color-brand-500)]">
            {formatPrice(lineTotal, currency)}
          </p>

          <button
            onClick={remove}
            disabled={pending}
            aria-label={t("remove", "Remove")}
            className="cart-trash"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Cart page row, like the reference: photo, name, option and brand in italic
 * grey, unit price, then a quantity stepper with "Update cart" (applies the
 * new quantity) and "Remove".
 */
function CartPageRow({ item, currency, onNavigate }: CartItemProps) {
  const { updateItem, removeItem } = useCart();
  const priceOverrides = useCartStore((s) => s.priceOverrides);
  const stockOverrides = useCartStore((s) => s.stockOverrides);
  const attributeOverrides = useCartStore((s) => s.attributeOverrides);
  const attributes = attributeOverrides[item.barcode_id] ?? [];
  const t = useT();
  const [qty, setQty] = useState(item.quantity);
  const [synced, setSynced] = useState(item.quantity);
  const [pending, setPending] = useState(false);

  // Follow quantity changes made elsewhere (drawer, another tab).
  if (item.quantity !== synced) {
    setSynced(item.quantity);
    setQty(item.quantity);
  }

  const href = `/products/${item.product_slug}`;
  const unitPrice = item.unit_price || priceOverrides[item.barcode_id] || 0;
  const maxQty = stockOverrides[item.barcode_id] ?? Infinity;
  const variantText = attributes.map((a) => a.value).join(" / ");

  const run = async (action: () => Promise<void>) => {
    if (pending) return;
    setPending(true);
    try {
      await action();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={cn("cart-page-row", pending && "opacity-60")}>
      <Link href={href} onClick={onNavigate} className="cart-page-img">
        {item.product_image ? (
          <Image src={item.product_image} alt={item.product_name} width={120} height={120} className="h-full w-full object-contain" />
        ) : (
          <span className="text-xs text-[var(--color-text-muted)]">{t("no_image", "No image")}</span>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={href} onClick={onNavigate} className="cart-page-name">
          {item.product_name}
        </Link>
        {variantText && <p className="cart-page-meta">{variantText}</p>}
        <p className="cart-page-price">{formatPrice(unitPrice, currency)}</p>
        <p className="cart-page-label">{t("quantity", "Quantity")}:</p>
        <div className="cart-page-actions">
          <div className="qty-stepper cart-page-qty">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label={t("decrease_qty", "Decrease quantity")}
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
            <span aria-live="polite">{pending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              disabled={qty >= maxQty}
              aria-label={t("increase_qty", "Increase quantity")}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
          <button
            type="button"
            className="cart-page-btn"
            disabled={pending || qty === item.quantity}
            onClick={() => run(() => updateItem(item.id, qty))}
          >
            {t("update_cart", "Update cart")}
          </button>
          <button type="button" className="cart-page-btn" disabled={pending} onClick={() => run(() => removeItem(item.id))}>
            {t("remove", "Remove")}
          </button>
        </div>
      </div>
    </div>
  );
}
