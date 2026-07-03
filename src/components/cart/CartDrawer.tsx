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
      title={`Cart: (${totalItems} ${totalItems === 1 ? "item" : "items"})`}
    >
      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add some products to get started."
          className="py-20"
        />
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4">
            {items.map((item) => (
              <CartItem key={item.id} item={item} currency={currency} />
            ))}
          </div>
          <CartSummary
            subTotal={subTotal}
            currency={currency}
            totalItems={totalItems}
            onClose={closeCart}
          />
        </div>
      )}
    </Drawer>
  );
}
