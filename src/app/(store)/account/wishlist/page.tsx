"use client";

import { useWishlist } from "@/lib/hooks/useWishlist";
import { WishlistGrid } from "@/components/account/WishlistGrid";
import { Spinner } from "@/components/ui/Spinner";

export default function WishlistPage() {
  const { items, isLoading, toggle } = useWishlist();

  const handleRemove = (id: number) => {
    const item = items.find((i) => i.id === id);
    if (item) toggle(item.product_slug, item.product_id);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <h2 className="font-display text-xl font-semibold mb-6">
        My Wishlist ({items.length})
      </h2>
      <WishlistGrid items={items} onRemove={handleRemove} />
    </div>
  );
}
