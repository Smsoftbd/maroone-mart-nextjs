"use client";

import { ShoppingBag } from "lucide-react";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCartStore } from "@/lib/stores/cartStore";

export default function CartPage() {
  const { items, totalItems, subTotal } = useCartStore();
  const currency = "৳"; // Will use store currency in a real implementation

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-3xl font-bold mb-8">
        Your Cart {totalItems > 0 && `(${totalItems})`}
      </h1>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Discover our products and add something you love."
          action={{ label: "Start Shopping", href: "/products" }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 divide-y divide-[var(--color-border)]">
            {items.map((item) => (
              <CartItem key={item.id} item={item} currency={currency} />
            ))}
          </div>
          <div className="lg:col-span-1">
            <div className="bg-surface-50 rounded-xl sticky top-24">
              <CartSummary
                subTotal={subTotal}
                currency={currency}
                totalItems={totalItems}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
