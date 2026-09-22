import { ProductCard, type ProductCardVariant } from "./ProductCard";
import { ItemListTracker } from "@/components/analytics/ItemListTracker";
import type { ItemList } from "@/lib/analytics/track";
import type { Product } from "@/lib/api/types";

interface ProductGridProps {
  products: Product[];
  currency: string;
  showWishlist?: boolean;
  variant?: ProductCardVariant;
  /** GA4 list for view_item_list / select_item. */
  list?: ItemList;
}

export function ProductGrid({
  products,
  currency,
  showWishlist = true,
  variant = "default",
  list,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--color-text-muted)]">
        No products found.
      </div>
    );
  }

  const grid = (
    <div
      className={
        variant === "minimal"
          ? "grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4"
          : variant === "shop"
            ? "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5"
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

  return list ? (
    <ItemListTracker list={list} products={products}>
      {grid}
    </ItemListTracker>
  ) : (
    grid
  );
}
