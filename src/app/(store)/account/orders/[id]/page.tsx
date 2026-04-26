"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { StatusHistoryTimeline } from "@/components/account/StatusHistoryTimeline";
import { useAuthStore } from "@/lib/stores/authStore";
import { getCustomerOrder } from "@/lib/api/customer";
import { formatPrice, formatDate } from "@/lib/utils/format";
import type { Order, StatusHistoryItem } from "@/lib/api/types";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);

  useEffect(() => {
    if (!token) return;
    getCustomerOrder(token, Number(id))
      .then((res) => {
        setOrder(res.data);
        setStatusHistory(res.status_history ?? []);
      })
      .catch(() => setNotFoundError(true))
      .finally(() => setIsLoading(false));
  }, [token, id]);

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (notFoundError || !order) return notFound();

  const paymentBadgeVariant = order.payment_status === "paid" ? "success" : order.payment_status === "partial" ? "warning" : "error";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">{order.invoice_number}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{formatDate(order.date)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant={paymentBadgeVariant} className="capitalize">
            {order.payment_status}
          </Badge>
          <Badge className="capitalize">{order.status_label || order.status}</Badge>
        </div>
      </div>

      {/* Status History Timeline */}
      {statusHistory.length > 0 && (
        <div className="bg-surface-50 rounded-xl p-4">
          <StatusHistoryTimeline statusHistory={statusHistory} />
        </div>
      )}

      {/* Shipping Address */}
      <div className="bg-surface-50 rounded-xl p-4 text-sm">
        <h3 className="font-semibold mb-2">Shipping Address</h3>
        <p className="text-[var(--color-text-secondary)]">
          {order.shipping_address.address}
          {order.shipping_address.city && `, ${order.shipping_address.city}`}
          {order.shipping_address.state && `, ${order.shipping_address.state}`}
          {order.shipping_address.country && `, ${order.shipping_address.country}`}
        </p>
      </div>

      {/* Items */}
      <div>
        <h3 className="font-semibold mb-3">Items</h3>
        <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          {order.details.map((detail) => {
            const sku = detail.barcode?.sku || detail.product.sku;
            return (
              <div key={detail.id} className="flex items-center gap-3 p-4 text-sm">
                {detail.product.image && (
                  <div className="relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden bg-surface-100">
                    <Image
                      src={detail.product.image}
                      alt={detail.product.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{detail.product.name}</p>
                  {sku && (
                    <p className="text-[var(--color-text-muted)] text-xs">{sku}</p>
                  )}
                  <p className="text-[var(--color-text-muted)] text-xs">Qty: {detail.qty}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-bold">{formatPrice(detail.sub_total, "৳")}</span>
                  {detail.discount_amount > 0 && (
                    <p className="text-xs text-green-600 mt-0.5">
                      -{formatPrice(detail.discount_amount, "৳")} off
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totals */}
      <div className="border-t border-[var(--color-border)] pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-[var(--color-text-secondary)]">
          <span>Subtotal</span>
          <span>{formatPrice(order.sub_total, "৳")}</span>
        </div>
        {order.discount_amount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-{formatPrice(order.discount_amount, "৳")}</span>
          </div>
        )}
        {order.tax_total > 0 && (
          <div className="flex justify-between text-[var(--color-text-secondary)]">
            <span>Tax</span>
            <span>{formatPrice(order.tax_total, "৳")}</span>
          </div>
        )}
        {order.shipping_cost > 0 && (
          <div className="flex justify-between text-[var(--color-text-secondary)]">
            <span>Shipping</span>
            <span>{formatPrice(order.shipping_cost, "৳")}</span>
          </div>
        )}
        {order.adjustment !== 0 && (
          <div className="flex justify-between text-[var(--color-text-secondary)]">
            <span>Adjustment</span>
            <span>{formatPrice(order.adjustment, "৳")}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base pt-1 border-t border-[var(--color-border)]">
          <span>Total</span>
          <span>{formatPrice(order.net_total, "৳")}</span>
        </div>
        {order.paid_amount > 0 && (
          <div className="flex justify-between text-green-600 text-sm">
            <span>Paid</span>
            <span>{formatPrice(order.paid_amount, "৳")}</span>
          </div>
        )}
        {order.due_amount > 0 && (
          <div className="flex justify-between text-red-600 font-medium text-sm">
            <span>Due</span>
            <span>{formatPrice(order.due_amount, "৳")}</span>
          </div>
        )}
      </div>

      {/* Tracking */}
      {order.tracking_number && (
        <div className="bg-surface-50 rounded-xl p-4 text-sm">
          <span className="font-medium">Tracking Number: </span>
          <span className="text-brand-500 font-mono">{order.tracking_number}</span>
        </div>
      )}
    </div>
  );
}
