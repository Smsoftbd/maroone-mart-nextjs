import { ProductCard, type ProductCardVariant } from "./ProductCard";
import type { Product } from "@/lib/api/types";

interface ProductGridProps {
  products: Product[];
  currency: string;
  showWishlist?: boolean;
  variant?: ProductCardVariant;
}

export function ProductGrid({
  products,
  currency,
  showWishlist = true,
  variant = "default",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--color-text-muted)]">
        No products found.
      </div>
    );
  }

  return (
    <div
      className={
        variant === "minimal"
          ? "grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4"
          : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4"
      }
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          currency={currency}
          showWishlist={showWishlist}
          variant={variant}
        />
      ))}
    </div>
  );
}
