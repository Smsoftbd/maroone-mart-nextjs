import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, formatDate } from "@/lib/utils/format";
import type { OrderListItem } from "@/lib/api/types";

const statusVariant = (status: string) => {
  if (["delivered", "confirmed"].includes(status)) return "success";
  if (["cancelled", "returned"].includes(status)) return "error";
  if (["shipped", "processing"].includes(status)) return "brand";
  return "neutral";
};

const paymentVariant = (status: string) => {
  if (status === "paid") return "success";
  if (status === "partial") return "warning";
  return "error";
};

interface OrderCardProps {
  order: OrderListItem;
  currency: string;
}

export function OrderCard({ order, currency }: OrderCardProps) {
  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="block bg-surface border border-[var(--color-border)] rounded-xl p-4 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-display font-semibold">{order.invoice_number}</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {formatDate(order.date)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant={statusVariant(order.status)}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
          <Badge variant={paymentVariant(order.payment_status)}>
            {order.payment_status}
          </Badge>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-bold text-lg">
          {formatPrice(order.net_total, currency)}
        </span>
        {order.tracking_number && (
          <span className="text-xs text-[var(--color-text-muted)]">
            Tracking: {order.tracking_number}
          </span>
        )}
      </div>
    </Link>
  );
}
