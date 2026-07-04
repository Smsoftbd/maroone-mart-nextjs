"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { OrderCard } from "@/components/account/OrderCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthStore } from "@/lib/stores/authStore";
import { getCustomerOrders } from "@/lib/api/customer";
import { useT } from "@/lib/i18n/I18nProvider";
import type { OrderListItem } from "@/lib/api/types";

export default function OrdersPage() {
  const { token } = useAuthStore();
  const t = useT();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getCustomerOrders(token)
      .then((res) => setOrders(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={t("no_orders", "No orders yet")}
        description={t("no_orders_desc", "Your orders will appear here after you make a purchase.")}
        action={{ label: t("start_shopping", "Start Shopping"), href: "/products" }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold">{t("order_history", "Order History")}</h2>
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} currency="৳" />
      ))}
    </div>
  );
}
