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
      // Columns come from the theme (layout.products_per_row / mobile_columns).
      className={
        variant === "minimal"
          ? "product-grid gap-x-4 gap-y-10"
          : variant === "shop"
            ? "product-grid gap-3 sm:gap-4"
            : "product-grid gap-4"
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
