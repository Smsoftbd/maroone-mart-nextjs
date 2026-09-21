"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { ShareButtons } from "./ShareButtons";
import { useCart } from "@/lib/hooks/useCart";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { formatPrice, formatDiscount } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/lib/i18n/I18nProvider";
import { metaEvents } from "@/lib/analytics/meta";
import type { Product, Barcode } from "@/lib/api/types";

interface ProductInfoProps {
  product: Product;
  currency: string;
  shareUrl: string;
}

const LOW_STOCK = 5;

export function ProductInfo({ product, currency, shareUrl }: ProductInfoProps) {
  const router = useRouter();
  const t = useT();
  const [selectedBarcode, setSelectedBarcode] = useState<Barcode>(
    product.barcodes.find((b) => b.is_active) ?? product.barcodes[0]
  );
  const { addItem, isLoading } = useCart();
  const { isInWishlist, toggle } = useWishlist();

  const minQty = Math.max(product.min_order_qty ?? product.min_order_quantity ?? 1, 1);
  const stock = selectedBarcode?.stock ?? 0;
  const maxOrder = product.max_order_qty ?? product.max_order_quantity ?? null;
  const maxQty = Math.max(minQty, maxOrder ? Math.min(stock, maxOrder) : stock);
  const [qty, setQty] = useState(minQty);

  const price = Math.max(selectedBarcode?.effective_price ?? 0, 0);
  const original = selectedBarcode?.price ?? 0;
  const hasDiscount = original > price && price > 0;
  const discountPct = hasDiscount ? formatDiscount(original, price) : null;
  const inStock = stock > 0;
  const lowStock = inStock && stock <= LOW_STOCK;
  const sku = selectedBarcode?.sku ?? product.sku;
  const inWishlist = isInWishlist(product.id);
  const category = product.child_category ?? product.sub_category ?? product.category;

  // Mobile sticky buy bar: shown once the main CTA row scrolls above the viewport.
  const ctaRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (showSticky) document.body.dataset.stickyCta = "";
    else delete document.body.dataset.stickyCta;
    return () => {
      delete document.body.dataset.stickyCta;
    };
  }, [showSticky]);

  useEffect(() => {
    metaEvents.viewContent({
      id: selectedBarcode?.id ?? product.id,
      name: product.name,
      price,
      quantity: 1,
      category: category?.name,
    });
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVariantChange = (b: Barcode) => {
    setSelectedBarcode(b);
    setQty(minQty);
  };

  const addSelected = async (openDrawer = true) => {
    if (!selectedBarcode) return false;
    await addItem(
      selectedBarcode.id,
      qty,
      product.name,
      price,
      selectedBarcode.stock,
      selectedBarcode.attributes,
      { openDrawer }
    );
    return true;
  };

  const handleBuyNow = async () => {
    if (await addSelected(false)) router.push("/checkout");
  };

  const disabled = isLoading || !inStock;

  return (
    <div className="product-content-wrap">
      {/* Eyebrow: category · brand */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
        {category && (
          <Link
            href={`/products?category=${encodeURIComponent(category.slug)}`}
            className="hover:text-[var(--color-text-primary)] transition-colors"
          >
            {category.name}
          </Link>
        )}
        {category && product.brand && <span aria-hidden>·</span>}
        {product.brand && (
          <Link
            href={`/products?brands=${product.brand.id}`}
            className="text-brand-500 hover:text-brand-600 transition-colors"
          >
            {product.brand.name}
          </Link>
        )}
      </div>

      {/* Title */}
      <h1 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-[var(--color-text-primary)] leading-tight tracking-tight">
        {product.name}
      </h1>

      {/* Rating / social proof */}
      {(product.rating_count > 0 || product.sale_count > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-text-secondary)]">
          {product.rating_count > 0 && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-[var(--color-text-primary)]">
                {product.rating_avg.toFixed(1)}
              </span>
              <span>({product.rating_count} {t("reviews", "reviews")})</span>
            </span>
          )}
          {product.rating_count > 0 && product.sale_count > 0 && (
            <span className="h-3 w-px bg-[var(--color-border-dark)]" aria-hidden />
          )}
          {product.sale_count > 0 && (
            <span>
              {product.sale_count.toLocaleString("en-US")} {t("sold", "sold")}
            </span>
          )}
        </div>
      )}

      {/* Price */}
      <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] tabular-nums">
          {formatPrice(price, currency)}
        </span>
        {hasDiscount && (
          <>
            <del className="text-lg text-[var(--color-text-muted)] tabular-nums">
              {formatPrice(original, currency)}
            </del>
            <span className="self-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
              -{discountPct}%
            </span>
          </>
        )}
      </div>
      {hasDiscount && (
        <p className="mt-1 text-sm text-[var(--color-success)]">
          {t("you_save", "You save")} {formatPrice(original - price, currency)}
        </p>
      )}

      {/* Stock */}
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
        <span
          className={cn(
            "relative flex h-2 w-2",
            inStock ? (lowStock ? "text-[var(--color-warning)]" : "text-[var(--color-success)]") : "text-[var(--color-error)]"
          )}
        >
          {inStock && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-50" />
          )}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
        <span
          className={cn(
            inStock ? (lowStock ? "text-[var(--color-warning)]" : "text-[var(--color-success)]") : "text-[var(--color-error)]"
          )}
        >
          {!inStock
            ? t("out_of_stock", "Out of Stock")
            : lowStock
            ? `${t("only", "Only")} ${stock} ${t("left_in_stock", "left in stock")}`
            : t("in_stock", "In Stock")}
        </span>
      </div>

      {/* Short description */}
      {product.short_description && (
        <div
          className="prose-content max-w-none text-[15px] text-[var(--color-text-secondary)] mt-5 [&_p:last-child]:mb-0"
          dangerouslySetInnerHTML={{ __html: product.short_description }}
        />
      )}

      <hr className="my-6 border-[var(--color-border)]" />

      {/* Variants */}
      {product.barcodes.length > 1 && (
        <div className="mb-6">
          <ProductVariantSelector
            barcodes={product.barcodes}
            onChange={handleVariantChange}
          />
        </div>
      )}

      {/* Quantity + CTAs */}
      <div ref={ctaRef} className="space-y-3">
        <div className="flex items-stretch gap-3">
          <div
            className={cn(
              "flex items-center rounded-full border border-[var(--color-border-dark)] h-12",
              !inStock && "opacity-50"
            )}
          >
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(minQty, q - 1))}
              disabled={!inStock || qty <= minQty}
              aria-label={t("decrease_quantity", "Decrease quantity")}
              className="flex h-full w-11 items-center justify-center rounded-l-full text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              disabled={!inStock || qty >= maxQty}
              aria-label={t("increase_quantity", "Increase quantity")}
              className="flex h-full w-11 items-center justify-center rounded-r-full text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => addSelected()}
            disabled={disabled}
            className="flex-1 h-12 rounded-full border border-[var(--color-text-primary)] text-[var(--color-text-primary)] font-medium flex items-center justify-center gap-2 hover:bg-[var(--color-text-primary)] hover:text-[var(--color-surface-0)] active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--color-text-primary)]"
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.75} />
            {t("add_to_cart", "Add to Cart")}
          </button>

          <button
            onClick={() =>
              toggle(product.slug, product.id, {
                id: selectedBarcode?.id ?? product.id,
                name: product.name,
                price,
                quantity: 1,
                category: category?.name,
              })
            }
            aria-label={inWishlist ? t("remove_from_wishlist", "Remove from wishlist") : t("add_to_wishlist", "Add to wishlist")}
            aria-pressed={inWishlist}
            className={cn(
              "shrink-0 h-12 w-12 rounded-full border flex items-center justify-center transition-colors",
              inWishlist
                ? "border-red-500 text-red-500"
                : "border-[var(--color-border-dark)] text-[var(--color-text-secondary)] hover:border-red-500 hover:text-red-500"
            )}
          >
            <Heart className={cn("h-5 w-5", inWishlist && "fill-current")} />
          </button>
        </div>

        <button
          onClick={handleBuyNow}
          disabled={disabled}
          className="w-full h-12 rounded-full bg-brand-500 text-[var(--color-primary-text)] font-semibold hover:bg-brand-600 active:scale-[0.99] transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {inStock ? t("buy_now", "Buy Now") : t("out_of_stock", "Out of Stock")}
        </button>
      </div>

      {/* Trust points */}
      <ul className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-[var(--color-text-secondary)]">
        <li className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-50 px-2 py-3">
          <Truck className="h-5 w-5 text-[var(--color-text-primary)]" strokeWidth={1.5} />
          {t("fast_delivery", "Fast delivery")}
        </li>
        <li className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-50 px-2 py-3">
          <RotateCcw className="h-5 w-5 text-[var(--color-text-primary)]" strokeWidth={1.5} />
          {product.is_returnable ? t("easy_returns", "Easy returns") : t("quality_checked", "Quality checked")}
        </li>
        <li className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-50 px-2 py-3">
          <ShieldCheck className="h-5 w-5 text-[var(--color-text-primary)]" strokeWidth={1.5} />
          {t("secure_payment", "Secure payment")}
        </li>
      </ul>

      {/* Meta */}
      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        {sku && (
          <>
            <dt className="text-[var(--color-text-muted)]">{t("sku", "SKU")}</dt>
            <dd className="text-[var(--color-text-primary)] font-mono text-[13px]">{sku}</dd>
          </>
        )}
        {product.unit?.name && (
          <>
            <dt className="text-[var(--color-text-muted)]">{t("unit", "Unit")}</dt>
            <dd className="text-[var(--color-text-primary)] capitalize">{product.unit.name}</dd>
          </>
        )}
        {product.brand && (
          <>
            <dt className="text-[var(--color-text-muted)]">{t("brand", "Brand")}</dt>
            <dd>
              <Link
                href={`/products?brands=${product.brand.id}`}
                className="capitalize text-[var(--color-text-primary)] underline-offset-4 hover:underline"
              >
                {product.brand.name}
              </Link>
            </dd>
          </>
        )}
      </dl>

      {/* Share */}
      <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
        <ShareButtons url={shareUrl} title={product.name} />
      </div>

      {/* Mobile sticky buy bar */}
      <div
        className={cn(
          "lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface-0)]/95 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-300",
          showSticky ? "translate-y-0" : "translate-y-full"
        )}
        aria-hidden={!showSticky}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-[var(--color-text-secondary)]">{product.name}</p>
            <p className="font-semibold tabular-nums">
              {formatPrice(price, currency)}
              {hasDiscount && (
                <del className="ml-2 text-xs font-normal text-[var(--color-text-muted)]">
                  {formatPrice(original, currency)}
                </del>
              )}
            </p>
          </div>
          <button
            onClick={() => addSelected()}
            disabled={disabled}
            tabIndex={showSticky ? 0 : -1}
            aria-label={t("add_to_cart", "Add to Cart")}
            className="h-11 w-11 shrink-0 rounded-full border border-[var(--color-text-primary)] flex items-center justify-center disabled:opacity-40"
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
          <button
            onClick={handleBuyNow}
            disabled={disabled}
            tabIndex={showSticky ? 0 : -1}
            className="h-11 shrink-0 rounded-full bg-brand-500 px-6 text-sm font-semibold text-[var(--color-primary-text)] disabled:opacity-40"
          >
            {t("buy_now", "Buy Now")}
          </button>
        </div>
      </div>
    </div>
  );
}
