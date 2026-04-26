"use client";

/**
 * ProductCard
 * @usage
 * <ProductCard product={product} currency="৳" showWishlist={true} />
 * Used in: ProductGrid, FeaturedProducts, NewArrivals, TopSelling, RelatedProducts
 */

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { formatPrice, formatDiscount } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Rating } from "@/components/ui/Rating";
import type { Product } from "@/lib/api/types";

interface ProductCardProps {
  product: Product;
  currency: string;
  showWishlist?: boolean;
}

export function ProductCard({
  product,
  currency,
  showWishlist = true,
}: ProductCardProps) {
  const { addItem, isLoading } = useCart();
  const { isInWishlist, toggle } = useWishlist();

  const defaultBarcode = product.barcodes.find((b) => b.is_active) ?? product.barcodes[0];
  const price = Math.max(defaultBarcode?.effective_price ?? 0, 0);
  const original = defaultBarcode?.price ?? 0;
  const hasDiscount = original > price && price > 0;
  const discountPct = hasDiscount ? formatDiscount(original, price) : null;
  const inStock = product.barcodes.some((b) => b.stock > 0);
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!defaultBarcode) return;
    await addItem(defaultBarcode.id, 1, product.name, price, defaultBarcode.stock);
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative bg-white rounded-xl border border-surface-100 overflow-hidden transition-shadow hover:shadow-md block"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-surface-50">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-105"
        />

        {/* Discount badge */}
        {discountPct && (
          <span className="absolute top-2 left-2 bg-[var(--color-secondary-text)] text-[var(--color-primary-text)] text-xs font-bold px-2 py-1 rounded-full z-10">
            -{discountPct}%
          </span>
        )}

        {/* Wishlist */}
        {showWishlist && (
          <button
            className={cn(
              "absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm z-10 transition-colors",
              inWishlist ? "text-brand-500" : "text-[var(--color-text-muted)] hover:text-brand-500"
            )}
            onClick={(e) => {
              e.preventDefault();
              toggle(product.slug, product.id);
            }}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
          </button>
        )}

        {/* Add to cart overlay */}
        {inStock && (
          <button
            className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-brand-500 text-[var(--color-primary-text)] text-sm font-medium py-3 text-center flex items-center justify-center gap-2 z-10"
            onClick={handleAddToCart}
            disabled={isLoading}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag className="h-4 w-4" />
            Add to Cart
          </button>
        )}

        {!inStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-xs font-medium text-[var(--color-text-muted)] bg-white px-3 py-1.5 rounded-full border">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {product.brand && (
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest mb-1 font-body">
            {product.brand.name}
          </p>
        )}
        <h3 className="font-display text-sm font-medium line-clamp-2 mb-1.5 leading-snug">
          {product.name}
        </h3>
        {product.rating_count > 0 && (
          <Rating
            value={product.rating_avg}
            count={product.rating_count}
            className="mb-1.5"
          />
        )}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-body font-bold text-base text-surface-900">
            {formatPrice(price, currency)}
          </span>
          {hasDiscount && (
            <span className="line-through text-[var(--color-text-muted)] text-sm">
              {formatPrice(original, currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
