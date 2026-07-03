"use client";

/**
 * ProductCard
 * @usage
 * <ProductCard product={product} currency="৳" showWishlist={true} />
 * Used in: ProductGrid, FeaturedProducts, NewArrivals, TopSelling, RelatedProducts
 */

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { formatPrice, formatDiscount } from "@/lib/utils/format";
import type { Product } from "@/lib/api/types";

interface ProductCardProps {
  product: Product;
  currency: string;
  showWishlist?: boolean;
}

export function ProductCard({ product, currency }: ProductCardProps) {
  const router = useRouter();
  const { addItem, isLoading } = useCart();

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
    await addItem(defaultBarcode.id, 1, product.name, price, defaultBarcode.stock);
    router.push("/checkout");
  };

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
            aria-label="Add To Cart"
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
            {inStock ? "Buy Now" : "Out of Stock"}
            {inStock && (
              <ArrowRight className="hidden @[150px]:inline-block" height={20} width={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
