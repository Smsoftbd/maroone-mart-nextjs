"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { OrderItemVariants } from "@/components/account/OrderItemVariants";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAuthStore } from "@/lib/stores/authStore";
import { cn } from "@/lib/utils/cn";
import type { Order } from "@/lib/api/types";

const schema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  phone: z.string().min(5, "Phone is required"),
});

type FormData = z.infer<typeof schema>;

export default function TrackOrderPage() {
  const { t, locale } = useI18n();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(data.invoiceNumber.trim())}?phone=${encodeURIComponent(data.phone.trim())}`);
      if (!res.ok) {
        setError("Order not found. Please check your invoice number and phone number.");
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

  // Prefill + auto-track when opened from an order page
  // (/track-order?invoice=SI-10002&phone=017…). Read from window.location
  // rather than useSearchParams so the page stays prerenderable without
  // a Suspense boundary.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invoiceNumber = params.get("invoice")?.trim() ?? "";
    const phone = params.get("phone")?.trim() ?? "";
    if (!invoiceNumber && !phone) return;
    reset({ invoiceNumber, phone });
    if (invoiceNumber && phone) handleSubmit(onSubmit)();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("max-w-2xl mx-auto", !isAuthenticated && "px-4 sm:px-6 py-12")}>
      <div className="text-center mb-10">
        <Package className="h-12 w-12 text-brand-ink mx-auto mb-4" />
        <h1 className="font-display text-3xl font-bold mb-2">{t("track_your_order", "Track Your Order")}</h1>
        <p className="text-[var(--color-text-secondary)]">
          {t("track_order_invoice_hint", "Enter your invoice number and phone number to track your order.")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-8">
        <Input
          label={t("invoice_number", "Invoice Number")}
          placeholder={t("invoice_number_ph", "e.g. SI-10002")}
          {...register("invoiceNumber")}
          error={errors.invoiceNumber?.message}
        />
        <Input
          label={t("phone_number", "Phone Number")}
          type="tel"
          {...register("phone")}
          error={errors.phone?.message}
        />
        <Button type="submit" variant="primary" fullWidth loading={isLoading}>
          {t("track_order", "Track Order")}
        </Button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {order && (
        <div className="bg-surface border border-[var(--color-border)] rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <p className="font-display text-xl font-semibold">{order.invoice_number}</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {formatDate(order.date, locale)}
              </p>
            </div>
            <p className="font-bold text-2xl">{formatPrice(order.net_total, "৳")}</p>
          </div>

          <OrderTimeline status={order.status} />

          {order.tracking_number && (
            <div className="bg-surface-50 rounded-xl p-4 text-sm">
              <span className="font-medium">{t("tracking", "Tracking")}: </span>
              <span className="text-brand-ink">{order.tracking_number}</span>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-3">{t("items_heading", "Items")}</h3>
            <div className="space-y-2">
              {order.details.map((detail) => (
                <div key={detail.id} className="flex justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <span className="text-[var(--color-text-secondary)]">
                      {detail.product.name} × {detail.qty}
                    </span>
                    <OrderItemVariants detail={detail} />
                  </div>
                  <span className="font-medium flex-shrink-0">{formatPrice(detail.sub_total, "৳")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
