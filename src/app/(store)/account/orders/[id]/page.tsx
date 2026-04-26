"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { useAuthStore } from "@/lib/stores/authStore";
import { getCustomerOrder } from "@/lib/api/customer";
import { formatPrice, formatDate } from "@/lib/utils/format";
import type { Order } from "@/lib/api/types";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);

  useEffect(() => {
    if (!token) return;
    getCustomerOrder(token, Number(id))
      .then((res) => setOrder(res.data))
      .catch(() => setNotFoundError(true))
      .finally(() => setIsLoading(false));
  }, [token, id]);

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (notFoundError || !order) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">{order.invoice_number}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{formatDate(order.date)}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={order.payment_status === "paid" ? "success" : "error"}>
            {order.payment_status}
          </Badge>
          <Badge>{order.status}</Badge>
        </div>
      </div>

      <OrderTimeline status={order.status} />

      {/* Address */}
      <div className="bg-surface-50 rounded-xl p-4 text-sm">
        <h3 className="font-semibold mb-2">Shipping Address</h3>
        <p className="text-[var(--color-text-secondary)]">
          {order.shipping_address.address}
          {order.shipping_address.city && `, ${order.shipping_address.city}`}
          {order.shipping_address.country && `, ${order.shipping_address.country}`}
        </p>
      </div>

      {/* Items */}
      <div>
        <h3 className="font-semibold mb-3">Items</h3>
        <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          {order.details.map((detail) => (
            <div key={detail.id} className="flex justify-between p-4 text-sm">
              <div>
                <p className="font-medium">{detail.product.name}</p>
                <p className="text-[var(--color-text-muted)]">
                  {detail.product.sku} × {detail.qty}
                </p>
              </div>
              <span className="font-bold">{formatPrice(detail.sub_total, "৳")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="border-t border-[var(--color-border)] pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-[var(--color-text-secondary)]">
          <span>Subtotal</span>
          <span>{formatPrice(order.sub_total, "৳")}</span>
        </div>
        {order.shipping_cost > 0 && (
          <div className="flex justify-between text-[var(--color-text-secondary)]">
            <span>Shipping</span>
            <span>{formatPrice(order.shipping_cost, "৳")}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base">
          <span>Total</span>
          <span>{formatPrice(order.net_total, "৳")}</span>
        </div>
      </div>
    </div>
  );
}
