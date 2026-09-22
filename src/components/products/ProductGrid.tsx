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
    // Columns + gap come from the theme (layout.products_per_row / mobile_columns / grid_gap).
    <div className="product-grid">
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
