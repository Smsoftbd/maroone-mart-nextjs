"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { WishlistItem } from "@/lib/api/types";

interface WishlistGridProps {
  items: WishlistItem[];
  onRemove: (id: number) => void;
}

export function WishlistGrid({ items, onRemove }: WishlistGridProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your wishlist is empty"
        description="Save items you love to your wishlist."
        action={{ label: "Start Shopping", href: "/products" }}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden"
        >
          <Link href={`/products/${item.product_slug}`}>
            <div className="relative aspect-square bg-surface-50">
              <Image
                src={item.product_image}
                alt={item.product_name}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-contain"
              />
            </div>
          </Link>
          <div className="p-3">
            <Link
              href={`/products/${item.product_slug}`}
              className="font-body text-sm font-medium line-clamp-2 hover:text-brand-ink transition-colors"
            >
              {item.product_name}
            </Link>
            <div className="flex items-center justify-between mt-2">
              <Link href={`/products/${item.product_slug}`}>
                <Button size="sm" variant="secondary" className="text-xs">
                  View
                </Button>
              </Link>
              <button
                onClick={() => onRemove(item.id)}
                className="p-1.5 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
                aria-label="Remove from wishlist"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
