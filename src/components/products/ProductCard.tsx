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
    <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
      <span className="flex items-center gap-1">
        {Number(product.rating_avg || 0).toFixed(1).replace(/\.0$/, "")}
        <Star className="h-3 w-3 fill-current text-[var(--color-tertiary-ink)]" />
      </span>
      <span className="h-3 w-px bg-[var(--color-border-dark)]" />
      <span>{product.rating_count ?? 0}</span>
    </div>
  );

  const priceRow = (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="price text-base font-bold">{formatPrice(price, currency)}</span>
      {hasDiscount && (
        <>
          <del className="price-old text-xs">{formatPrice(original, currency)}</del>
          <span className="badge-discount rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none">
            {discountPct}% OFF
          </span>
        </>
      )}
    </div>
  );

  if (variant === "compact") {
    return (
      <div
        className="store-card group flex h-full items-center gap-4 p-4"
        onClickCapture={onCardClick}
      >
        <Link href={href} className="store-card-img relative block h-24 w-24 shrink-0 overflow-hidden sm:h-28 sm:w-28">
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
          <p className="truncate text-xs text-brand-ink">{brandName}</p>
          <h2 className="font-body font-normal tracking-normal">
            <Link href={href} className="card-title line-clamp-1 text-sm font-medium hover:text-brand-ink">
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
        className="store-card group flex h-full flex-col p-1.5"
        onClickCapture={onCardClick}
      >
        <div className="store-card-img relative overflow-hidden">
          <Link href={href} className="block aspect-product">
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
            <span className="absolute inset-x-0 bottom-0 bg-surface/90 py-1.5 text-center text-[11px] font-medium text-[var(--color-text-primary)]">
              {t("out_of_stock", "Out of Stock")}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 px-1.5 pb-1.5 pt-3">
          <p className="truncate text-xs text-brand-ink">{brandName}</p>
          <h2 className="font-body font-normal tracking-normal">
            <Link href={href} className="card-title line-clamp-1 text-sm font-medium hover:text-brand-ink">
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
              className="btn-cart flex h-9 w-9 shrink-0 items-center justify-center"
            >
              <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isLoading || !inStock}
              className="btn-buy flex h-9 w-full items-center justify-center gap-1.5 px-2 text-sm font-semibold"
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
        <div className="store-card-img relative overflow-hidden">
          <Link href={href} className="block aspect-product">
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
            <span className="badge-discount absolute left-0 top-3 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em]">
              −{discountPct}%
            </span>
          )}

          {!inStock && (
            <span className="absolute inset-x-0 bottom-0 bg-surface/90 py-2 text-center text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-primary)] backdrop-blur-sm">
              {t("out_of_stock", "Out of Stock")}
            </span>
          )}

          {/* Desktop: quick add slides up on hover */}
          {inStock && (
            <div className="pointer-events-none absolute inset-x-2 bottom-2 hidden translate-y-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 sm:block">
              <button
                onClick={handleAddToCart}
                disabled={isLoading}
                className="btn-cart pointer-events-auto w-full py-2.5 text-[11px] font-medium tracking-[0.18em]"
              >
                {t("add_to_cart", "Add to Cart")}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col pt-3">
          <h2 className="font-body font-normal tracking-normal">
            <Link
              href={href}
              className="product-title card-title line-clamp-1 text-[13px] leading-snug transition-opacity hover:opacity-60"
            >
              {product.name}
            </Link>
          </h2>

          <div className="product-price mt-1.5 flex items-baseline gap-2">
            <span className="price text-[13px] font-medium tracking-wide">
              {formatPrice(price, currency)}
            </span>
            {hasDiscount && (
              <del className="old-price price-old text-[11px] font-normal">
                {formatPrice(original, currency)}
              </del>
            )}
          </div>

          {/* Desktop: buy now as a hairline text link */}
          <button
            onClick={handleBuyNow}
            disabled={isLoading || !inStock}
            className="mt-2.5 hidden w-fit border-b border-current pb-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-primary)] transition-opacity hover:opacity-60 disabled:opacity-40 sm:block"
          >
            {inStock ? t("buy_now", "Buy Now") : t("out_of_stock", "Out of Stock")}
          </button>

          {/* Mobile: no hover, so both actions stay visible */}
          <div className="product-actions mt-3 flex items-center gap-2 sm:hidden">
            <button
              aria-label={t("add_to_cart", "Add to Cart")}
              onClick={handleAddToCart}
              disabled={isLoading || !inStock}
              className="action-btn btn-cart flex h-9 w-9 shrink-0 items-center justify-center"
            >
              <ShoppingCart className="active:scale-90" height={16} width={16} strokeWidth={1.5} />
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isLoading || !inStock}
              className="action-btn btn-buy h-9 w-full text-[10px] font-medium tracking-[0.16em]"
            >
              {inStock ? t("buy_now", "Buy Now") : t("out_of_stock", "Out of Stock")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="store-card relative product-card-wrap p-3" onClickCapture={onCardClick}>
      <div className="product-img-action-wrap relative @container">
        <div className="store-card-img product-img overflow-hidden aspect-product">
          <Link href={href}>
            <Image
              src={product.image}
              alt={product.name}
              width={226}
              height={400}
              loading="lazy"
              className="default-img h-full w-full object-cover object-top hover:scale-125 transition-transform duration-300 ease-in-out"
            />
          </Link>
        </div>
      </div>

      <div className="product-content-wrap @container">
        <h2 className="font-body font-normal tracking-normal">
          <Link
            href={href}
            className="product-title card-title text-base font-body line-clamp-1"
          >
            {product.name}
          </Link>
        </h2>

        <div className="product-price mb-3 flex flex-row items-center gap-2">
          <span className="price font-semibold">{formatPrice(price, currency)}</span>
          {hasDiscount && (
            <div className="flex items-center gap-2">
              <del className="old-price price-old text-sm font-normal">
                {formatPrice(original, currency)}
              </del>
              <span className="absolute md:static bottom-28 left-2 z-20 discount-badge badge-discount rounded px-1 ml-1 !text-[12px]">
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
            className="action-btn btn-cart p-1 lg:px-2 text-sm lg:text-lg"
          >
            <ShoppingCart className="active:scale-90" height={20} width={20} strokeWidth={1.5} />
          </button>
          <button
            onClick={handleBuyNow}
            disabled={isLoading || !inStock}
            className="action-btn btn-buy p-1 text-sm lg:text-lg lg:px-4 py-1 w-full flex items-center justify-center gap-1"
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
