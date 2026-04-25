"use client";

import { ShoppingBag } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { useCartStore } from "@/lib/stores/cartStore";

interface CartDrawerProps {
  currency: string;
}

export function CartDrawer({ currency }: CartDrawerProps) {
  const { isOpen, closeCart, items, totalItems, subTotal } = useCartStore();

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeCart}
      title={`Your Cart (${totalItems})`}
      className="flex flex-col"
    >
      <div className="flex-1 overflow-y-auto px-5 divide-y divide-[var(--color-border)]">
        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Add some products to get started."
            className="py-20"
          />
        ) : (
          items.map((item) => (
            <CartItem key={item.id} item={item} currency={currency} />
          ))
        )}
      </div>
      {items.length > 0 && (
        <CartSummary
          subTotal={subTotal}
          currency={currency}
          totalItems={totalItems}
          onClose={closeCart}
        />
      )}
    </Drawer>
  );
}
