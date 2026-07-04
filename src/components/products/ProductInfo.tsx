"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Zap } from "lucide-react";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { ShareButtons } from "./ShareButtons";
import { useCart } from "@/lib/hooks/useCart";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { formatPrice, formatDiscount } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/lib/i18n/I18nProvider";
import type { Product, Barcode } from "@/lib/api/types";

interface ProductInfoProps {
  product: Product;
  currency: string;
  shareUrl: string;
}

export function ProductInfo({ product, currency, shareUrl }: ProductInfoProps) {
  const router = useRouter();
  const t = useT();
  const [selectedBarcode, setSelectedBarcode] = useState<Barcode>(
    product.barcodes.find((b) => b.is_active) ?? product.barcodes[0]
  );
  const { addItem, isLoading } = useCart();
  const { isInWishlist, toggle } = useWishlist();

  const minQty = product.min_order_qty ?? product.min_order_quantity ?? 1;
  const price = Math.max(selectedBarcode?.effective_price ?? 0, 0);
  const original = selectedBarcode?.price ?? 0;
  const hasDiscount = original > price && price > 0;
  const discountPct = hasDiscount ? formatDiscount(original, price) : null;
  const inStock = (selectedBarcode?.stock ?? 0) > 0;
  const sku = selectedBarcode?.sku ?? product.sku;
  const inWishlist = isInWishlist(product.id);

  const addSelected = async () => {
    if (!selectedBarcode) return false;
    await addItem(
      selectedBarcode.id,
      minQty,
      product.name,
      price,
      selectedBarcode.stock,
      selectedBarcode.attributes
    );
    return true;
  };

  const handleBuyNow = async () => {
    if (await addSelected()) router.push("/checkout");
  };

  return (
    <div className="product-content-wrap">
      {/* Brand */}
      {product.brand && (
        <Link
          href={`/products?brands=${product.brand.id}`}
          className="inline-block text-sm font-bold text-brand-500 capitalize mb-1 lg:mb-2 hover:text-brand-600 transition-colors"
        >
          {product.brand.name}
        </Link>
      )}

      {/* Title */}
      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] leading-tight">
        {product.name}
      </h1>

      {/* Price */}
      <div className="product-price flex items-center gap-4 lg:border-b border-[var(--color-border)] py-3 lg:py-5">
        <span className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">
          {formatPrice(price, currency)}
        </span>
        {hasDiscount && (
          <>
            <del className="text-base lg:text-lg font-normal text-[var(--color-text-muted)]">
              {formatPrice(original, currency)}
            </del>
            <span className="inline-block text-base font-semibold text-white bg-red-500 rounded-md py-1 px-2">
              {discountPct}% OFF
            </span>
          </>
        )}
      </div>

      {/* Brand */}
      {product.brand && (
        <div className="flex items-center gap-2 lg:pt-3 text-lg">
          <span className="text-[var(--color-text-primary)]">{t("brand", "Brand")}:</span>
          <Link
            href={`/products?brands=${product.brand.id}`}
            className="capitalize text-brand-500 hover:text-brand-600 transition-colors"
          >
            {product.brand.name}
          </Link>
        </div>
      )}

      {/* Unit */}
      {product.unit?.name && (
        <div className="flex items-center gap-2 lg:pt-3 text-lg">
          <span className="text-[var(--color-text-primary)]">{t("unit", "Unit")}:</span>
          <span className="capitalize">{product.unit.name}</span>
        </div>
      )}

      {/* SKU */}
      {sku && (
        <div className="flex items-center gap-2 lg:py-3 text-lg">
          <span className="text-[var(--color-text-primary)]">{t("sku", "SKU")}:</span>
          <span>{sku}</span>
        </div>
      )}

      {/* Short description */}
      {product.short_description && (
        <div
          className="prose-content max-w-none text-sm mt-2"
          dangerouslySetInnerHTML={{ __html: product.short_description }}
        />
      )}

      {/* Variants */}
      {product.barcodes.length > 1 && (
        <div className="mt-4">
          <ProductVariantSelector
            barcodes={product.barcodes}
            onChange={setSelectedBarcode}
          />
        </div>
      )}

      {/* Stock note */}
      <p
        className={cn(
          "mt-4 text-sm font-medium",
          inStock ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
        )}
      >
        {inStock ? `${t("in_stock", "In Stock")} (${selectedBarcode?.stock})` : t("out_of_stock", "Out of Stock")}
      </p>

      {/* CTA buttons */}
      <div className="py-2 pt-6 lg:pt-8 lg:pb-4">
        <div className="product-actions flex gap-4 justify-between items-center">
          <button
            onClick={addSelected}
            disabled={isLoading || !inStock}
            className="bg-brand-500 py-3 w-full px-2 lg:px-6 text-[var(--color-primary-text)] text-center active:scale-95 rounded-lg flex items-center justify-center gap-2 hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="h-5 w-5" strokeWidth={1.5} />
            <span>{t("add_to_cart", "Add to Cart")}</span>
          </button>
          <button
            onClick={handleBuyNow}
            disabled={isLoading || !inStock}
            className="bg-brand-600 py-3 w-full px-2 lg:px-6 text-[var(--color-primary-text)] text-center active:scale-95 rounded-lg flex items-center justify-center gap-2 hover:bg-brand-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="h-5 w-5" />
            <span>{t("buy_now", "Buy Now")}</span>
          </button>
          <button
            onClick={() => toggle(product.slug, product.id)}
            aria-label={inWishlist ? t("remove_from_wishlist", "Remove from wishlist") : t("add_to_wishlist", "Add to wishlist")}
            className={cn(
              "shrink-0 p-3 rounded-lg border transition-colors",
              inWishlist
                ? "border-brand-500 text-brand-500"
                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-brand-300 hover:text-brand-500"
            )}
          >
            <Heart className={cn("h-5 w-5", inWishlist && "fill-current")} />
          </button>
        </div>
      </div>

      {/* Share */}
      <ShareButtons url={shareUrl} title={product.name} />
    </div>
  );
}
