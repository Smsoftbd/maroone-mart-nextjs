"use client";

/**
 * ProductCard
 * @usage
 * <ProductCard product={product} currency="৳" showWishlist={true} />
 * <ProductCard product={product} currency="৳" variant="minimal" />
 * Used in: ProductGrid, FeaturedProducts, NewArrivals, TopSelling, RelatedProducts
 *
 * `variant="minimal"` is the editorial, chrome-less card.
 * `variant="shop"` is the bordered marketplace card used by the homepage grids/carousels.
 * `variant="compact"` is the horizontal (image-left) card used by the homepage New Arrivals list.
 * Every other page keeps the default boxed card.
 */

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, ArrowRight, Star } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { useT } from "@/lib/i18n/I18nProvider";
import { formatPrice, formatDiscount } from "@/lib/utils/format";
import { useSelectItem } from "@/components/analytics/ItemListTracker";
import type { Product } from "@/lib/api/types";

export type ProductCardVariant = "default" | "minimal" | "shop" | "compact";

interface ProductCardProps {
  product: Product;
  currency: string;
  showWishlist?: boolean;
  variant?: ProductCardVariant;
}

export function ProductCard({ product, currency, variant = "default" }: ProductCardProps) {
  const router = useRouter();
  const { addItem, isLoading } = useCart();
  const t = useT();
  const selectItem = useSelectItem(product);
  // select_item when a product link (image/title) is followed from a tracked list.
  const onCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) selectItem();
  };

  const isVariable = product.type === "variable";
  const defaultBarcode = product.barcodes.find((b) => b.is_active) ?? product.barcodes[0];
  const price = Math.max(defaultBarcode?.effective_price ?? 0, 0);
  const original = defaultBarcode?.price ?? 0;
  const hasDiscount = original > price && price > 0;
  const discountPct = hasDiscount ? formatDiscount(original, price) : null;
  // List endpoint can return per-barcode stock=0 even when the product has
  // stock; fall back to the product-level stock_qty so cards don't wrongly
  // show "Out of Stock". Per-variant stock stays authoritative on the detail page.
  const inStock =
    product.barcodes.some((b) => b.stock > 0) || (product.stock_qty ?? 0) > 0;
  const href = `/products/${product.slug}`;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!defaultBarcode) return;
    if (isVariable) {
      router.push(href);
      return;
    }
    await addItem(defaultBarcode.id, 1, product.name, price, defaultBarcode.stock);
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!defaultBarcode) return;
    if (isVariable) {
      router.push(href);
      return;
    }
    await addItem(defaultBarcode.id, 1, product.name, price, defaultBarcode.stock, undefined, {
      openDrawer: false,
    });
    router.push("/checkout");
  };

  const brandName = product.brand?.name || t("no_brand", "No Brand");

  const ratingRow = (
    <div className="flex items-center gap-2 text-xs text-slate-700">
      <span className="flex items-center gap-1">
        {Number(product.rating_avg || 0).toFixed(1).replace(/\.0$/, "")}
        <Star className="h-3 w-3 fill-brand-500 text-brand-500" />
      </span>
      <span className="h-3 w-px bg-slate-300" />
      <span>{product.rating_count ?? 0}</span>
    </div>
  );

  const priceRow = (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-base font-bold text-red-500">{formatPrice(price, currency)}</span>
      {hasDiscount && (
        <>
          <del className="text-xs text-slate-400">{formatPrice(original, currency)}</del>
          <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
            {discountPct}% OFF
          </span>
        </>
      )}
    </div>
  );

  if (variant === "compact") {
    return (
      <div
        className="group flex h-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
        onClickCapture={onCardClick}
      >
        <Link href={href} className="relative block h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-100 sm:h-28 sm:w-28">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="112px"
            loading="lazy"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate text-xs text-brand-500">{brandName}</p>
          <h2>
            <Link href={href} className="line-clamp-1 text-sm font-medium text-slate-900 hover:text-brand-500">
              {product.name}
            </Link>
          </h2>
          {ratingRow}
          {priceRow}
        </div>
      </div>
    );
  }

  if (variant === "shop") {
    return (
      <div
        className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-1.5 transition-shadow hover:shadow-md"
        onClickCapture={onCardClick}
      >
        <div className="relative overflow-hidden rounded-lg bg-surface-100">
          <Link href={href} className="block aspect-square">
            <Image
              src={product.image}
              alt={product.name}
              width={300}
              height={300}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>
          {!inStock && (
            <span className="absolute inset-x-0 bottom-0 bg-white/90 py-1.5 text-center text-[11px] font-medium text-slate-900">
              {t("out_of_stock", "Out of Stock")}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 px-1.5 pb-1.5 pt-3">
          <p className="truncate text-xs text-brand-500">{brandName}</p>
          <h2>
            <Link href={href} className="line-clamp-1 text-sm font-medium text-slate-900 hover:text-brand-500">
              {product.name}
            </Link>
          </h2>
          {ratingRow}
          {priceRow}

          <div className="mt-auto flex items-center gap-2 pt-1.5">
            <button
              aria-label={t("add_to_cart", "Add to Cart")}
              onClick={handleAddToCart}
              disabled={isLoading || !inStock}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-brand-500 text-brand-500 transition-colors hover:bg-brand-500 hover:text-[var(--color-primary-text)] disabled:opacity-40"
            >
              <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isLoading || !inStock}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-brand-500 px-2 text-sm font-semibold text-[var(--color-primary-text)] transition-colors hover:bg-brand-600 disabled:opacity-40"
            >
              <span className="truncate">
                {inStock ? t("buy_now", "Buy Now") : t("out_of_stock", "Out of Stock")}
              </span>
              {inStock && <ArrowRight className="hidden h-4 w-4 shrink-0 sm:block" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className="group product-card-wrap relative flex h-full flex-col" onClickCapture={onCardClick}>
        <div className="relative overflow-hidden bg-surface-100">
          <Link href={href} className="block aspect-[3/4]">
            <Image
              src={product.image}
              alt={product.name}
              width={226}
              height={400}
              loading="lazy"
              className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          </Link>

          {hasDiscount && (
            <span className="absolute left-0 top-3 bg-neutral-900 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white">
              −{discountPct}%
            </span>
          )}

          {!inStock && (
            <span className="absolute inset-x-0 bottom-0 bg-white/90 py-2 text-center text-[10px] uppercase tracking-[0.2em] text-neutral-900 backdrop-blur-sm">
              {t("out_of_stock", "Out of Stock")}
            </span>
          )}

          {/* Desktop: quick add slides up on hover */}
          {inStock && (
            <div className="pointer-events-none absolute inset-x-2 bottom-2 hidden translate-y-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 sm:block">
              <button
                onClick={handleAddToCart}
                disabled={isLoading}
                className="pointer-events-auto w-full bg-white/95 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-900 backdrop-blur-sm transition-colors hover:bg-neutral-900 hover:text-white disabled:opacity-40"
              >
                {t("add_to_cart", "Add to Cart")}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col pt-3">
          <h2>
            <Link
              href={href}
              className="product-title line-clamp-1 text-[13px] leading-snug text-neutral-900 transition-opacity hover:opacity-60"
            >
              {product.name}
            </Link>
          </h2>

          <div className="product-price mt-1.5 flex items-baseline gap-2">
            <span className="text-[13px] font-medium tracking-wide text-neutral-900">
              {formatPrice(price, currency)}
            </span>
            {hasDiscount && (
              <del className="old-price text-[11px] font-normal text-neutral-400">
                {formatPrice(original, currency)}
              </del>
            )}
          </div>

          {/* Desktop: buy now as a hairline text link */}
          <button
            onClick={handleBuyNow}
            disabled={isLoading || !inStock}
            className="mt-2.5 hidden w-fit border-b border-neutral-900 pb-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-900 transition-opacity hover:opacity-60 disabled:opacity-40 sm:block"
          >
            {inStock ? t("buy_now", "Buy Now") : t("out_of_stock", "Out of Stock")}
          </button>

          {/* Mobile: no hover, so both actions stay visible */}
          <div className="product-actions mt-3 flex items-center gap-2 sm:hidden">
            <button
              aria-label={t("add_to_cart", "Add to Cart")}
              onClick={handleAddToCart}
              disabled={isLoading || !inStock}
              className="action-btn flex h-9 w-9 shrink-0 items-center justify-center border border-neutral-900 text-neutral-900 disabled:opacity-40"
            >
              <ShoppingCart className="active:scale-90" height={16} width={16} strokeWidth={1.5} />
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isLoading || !inStock}
              className="action-btn h-9 w-full border border-neutral-900 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-900 transition-colors active:bg-neutral-900 active:text-white disabled:opacity-40"
            >
              {inStock ? t("buy_now", "Buy Now") : t("out_of_stock", "Out of Stock")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative product-card-wrap bg-white rounded shadow p-3" onClickCapture={onCardClick}>
      <div className="product-img-action-wrap relative @container">
        <div className="product-img overflow-hidden aspect-[4/5] rounded-t">
          <Link href={href}>
            <Image
              src={product.image}
              alt={product.name}
              width={226}
              height={400}
              loading="lazy"
              className="default-img h-full w-full object-cover object-top hover:scale-125 transition-transform duration-300 ease-in-out rounded-t"
            />
          </Link>
        </div>
      </div>

      <div className="product-content-wrap @container">
        <h2>
          <Link
            href={href}
            className="product-title text-base text-slate-900 font-body line-clamp-1"
          >
            {product.name}
          </Link>
        </h2>

        <div className="product-price mb-3 flex flex-row font-title items-center gap-2">
          <span className="font-semibold">{formatPrice(price, currency)}</span>
          {hasDiscount && (
            <div className="flex items-center gap-2">
              <del className="old-price text-sm font-normal text-slate-400">
                {formatPrice(original, currency)}
              </del>
              <span className="absolute md:static bottom-28 left-2 z-20 discount-badge rounded text-white bg-red-500 px-1 ml-1 !text-[12px]">
                {discountPct}% OFF
              </span>
            </div>
          )}
        </div>

        <div className="product-actions flex justify-between items-center gap-1 sm:gap-2">
          <button
            aria-label={t("add_to_cart", "Add to Cart")}
            onClick={handleAddToCart}
            disabled={isLoading || !inStock}
            className="action-btn p-1 lg:px-2 text-sm lg:text-lg rounded border border-black bg-transparent text-black disabled:opacity-40"
          >
            <ShoppingCart className="active:scale-90" height={20} width={20} strokeWidth={1.5} />
          </button>
          <button
            onClick={handleBuyNow}
            disabled={isLoading || !inStock}
            className="action-btn p-1 text-sm lg:text-lg lg:px-4 py-1 w-full rounded border border-black bg-transparent text-black disabled:opacity-40 flex items-center justify-center gap-1"
          >
            {inStock ? t("buy_now", "Buy Now") : t("out_of_stock", "Out of Stock")}
            {inStock && (
              <ArrowRight className="hidden @[150px]:inline-block" height={20} width={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
