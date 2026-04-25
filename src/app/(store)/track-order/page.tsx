"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { formatPrice, formatDate } from "@/lib/utils/format";
import type { Order } from "@/lib/api/types";

const schema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  phone: z.string().min(5, "Phone is required"),
});

type FormData = z.infer<typeof schema>;

export default function TrackOrderPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch(`/api/orders/${data.orderId}?phone=${encodeURIComponent(data.phone)}`);
      if (!res.ok) {
        setError("Order not found. Please check your order ID and phone number.");
        return;
      }
      const result = await res.json();
      setOrder(result.data);
    } catch {
      setError("Failed to track order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <Package className="h-12 w-12 text-brand-500 mx-auto mb-4" />
        <h1 className="font-display text-3xl font-bold mb-2">Track Your Order</h1>
        <p className="text-[var(--color-text-secondary)]">
          Enter your order ID and phone number to track your order.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-8">
        <Input
          label="Order ID"
          placeholder="e.g. 12345"
          {...register("orderId")}
          error={errors.orderId?.message}
        />
        <Input
          label="Phone Number"
          type="tel"
          {...register("phone")}
          error={errors.phone?.message}
        />
        <Button type="submit" variant="primary" fullWidth loading={isLoading}>
          Track Order
        </Button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {order && (
        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <p className="font-display text-xl font-semibold">{order.invoice_number}</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {formatDate(order.date)}
              </p>
            </div>
            <p className="font-bold text-2xl">{formatPrice(order.net_total, "৳")}</p>
          </div>

          <OrderTimeline status={order.status} />

          {order.tracking_number && (
            <div className="bg-surface-50 rounded-xl p-4 text-sm">
              <span className="font-medium">Tracking: </span>
              <span className="text-brand-500">{order.tracking_number}</span>
            </div>
          )}

          {order.estimated_delivery_date && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              Estimated delivery: {formatDate(order.estimated_delivery_date)}
            </p>
          )}

          <div>
            <h3 className="font-semibold mb-3">Items</h3>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">
                    {item.product_name} × {item.quantity}
                  </span>
                  <span className="font-medium">{formatPrice(item.sub_total, "৳")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
