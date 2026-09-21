"use client";

/**
 * ProductCard
 * @usage
 * <ProductCard product={product} currency="৳" showWishlist={true} />
 * <ProductCard product={product} currency="৳" variant="minimal" />
 * Used in: ProductGrid, FeaturedProducts, NewArrivals, TopSelling, RelatedProducts
 *
 * `variant="minimal"` is the editorial, chrome-less card used by the homepage
 * sections only. Every other page keeps the default boxed card.
 */

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { useT } from "@/lib/i18n/I18nProvider";
import { formatPrice, formatDiscount } from "@/lib/utils/format";
import type { Product } from "@/lib/api/types";

export type ProductCardVariant = "default" | "minimal";

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

  if (variant === "minimal") {
    return (
      <div className="group product-card-wrap relative flex h-full flex-col">
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
    <div className="relative product-card-wrap bg-white rounded shadow p-3">
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
