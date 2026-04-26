"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Minus, Plus, ShoppingBag, Truck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { useCart } from "@/lib/hooks/useCart";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { formatPrice, formatDiscount } from "@/lib/utils/format";
import type { Product, Barcode } from "@/lib/api/types";

interface ProductInfoProps {
  product: Product;
  currency: string;
}

export function ProductInfo({ product, currency }: ProductInfoProps) {
  const [selectedBarcode, setSelectedBarcode] = useState<Barcode>(
    product.barcodes.find((b) => b.is_active) ?? product.barcodes[0]
  );
  const [quantity, setQuantity] = useState(product.min_order_quantity || 1);
  const { addItem, isLoading } = useCart();
  const { isInWishlist, toggle } = useWishlist();

  const price = Math.max(selectedBarcode?.effective_price ?? 0, 0);
  const original = selectedBarcode?.price ?? 0;
  const hasDiscount = original > price;
  const inStock = (selectedBarcode?.stock ?? 0) > 0;
  const maxQty = Math.min(
    product.max_order_quantity || 999,
    selectedBarcode?.stock ?? 999
  );
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async () => {
    if (!selectedBarcode) return;
    await addItem(selectedBarcode.id, quantity, product.name, price, selectedBarcode.stock);
  };

  return (
    <div className="space-y-6">
      {/* Brand + Category */}
      <div className="flex items-center gap-2 flex-wrap">
        {product.brand && (
          <span className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] font-body">
            {product.brand.name}
          </span>
        )}
        <Link
          href={`/categories/${product.category.slug}`}
          className="text-xs text-brand-500 hover:text-brand-600 transition-colors"
        >
          {product.category.name}
        </Link>
      </div>

      {/* Title */}
      <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight">
        {product.name}
      </h1>

      {/* Rating */}
      {product.rating_count > 0 && (
        <Rating
          value={product.rating_avg}
          count={product.rating_count}
          size="md"
        />
      )}

      {/* Price */}
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="font-body font-bold text-3xl text-surface-900">
          {formatPrice(price, currency)}
        </span>
        {hasDiscount && (
          <>
            <span className="line-through text-[var(--color-text-muted)] text-xl">
              {formatPrice(original, currency)}
            </span>
            <Badge variant="brand">
              -{formatDiscount(original, price)}% OFF
            </Badge>
          </>
        )}
      </div>

      {/* Stock */}
      <Badge variant={inStock ? "success" : "error"}>
        {inStock
          ? `In Stock (${selectedBarcode?.stock})`
          : "Out of Stock"}
      </Badge>

      {/* Variants */}
      {product.type === "complex" && product.barcodes.length > 1 && (
        <ProductVariantSelector
          barcodes={product.barcodes}
          onChange={setSelectedBarcode}
        />
      )}

      {/* Quantity */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Quantity:</span>
        <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
          <button
            className="px-3 py-2 hover:bg-surface-100 transition-colors disabled:opacity-40"
            onClick={() => setQuantity((q) => Math.max(product.min_order_quantity || 1, q - 1))}
            disabled={quantity <= (product.min_order_quantity || 1)}
            aria-label="Decrease"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="px-4 py-2 font-medium tabular-nums min-w-[3rem] text-center">
            {quantity}
          </span>
          <button
            className="px-3 py-2 hover:bg-surface-100 transition-colors disabled:opacity-40"
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={quantity >= maxQty}
            aria-label="Increase"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={!inStock}
          onClick={handleAddToCart}
          className="flex-1"
        >
          <ShoppingBag className="h-5 w-5" />
          Add to Cart
        </Button>
        <button
          onClick={() => toggle(product.slug, product.id)}
          className={`p-3 rounded-lg border-2 transition-colors ${
            inWishlist
              ? "border-brand-500 text-brand-500"
              : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-brand-300 hover:text-brand-500"
          }`}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-5 w-5 ${inWishlist ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Trust signals */}
      <div className="border-t border-[var(--color-border)] pt-4 space-y-2">
        {product.is_returnable && (
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <RotateCcw className="h-4 w-4 shrink-0" />
            <span>Easy returns available</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <Truck className="h-4 w-4 shrink-0" />
          <span>Check delivery options at checkout</span>
        </div>
      </div>

      {/* Short description */}
      {product.short_description && (
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          {product.short_description}
        </p>
      )}
    </div>
  );
}
