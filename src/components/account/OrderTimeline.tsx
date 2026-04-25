import { CheckCircle, Circle } from "lucide-react";
import type { OrderStatus } from "@/lib/api/types";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "pending", label: "Order Placed" },
  { status: "confirmed", label: "Confirmed" },
  { status: "processing", label: "Processing" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
];

const ORDER_INDEX: Record<string, number> = {
  draft: -1,
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
};

interface OrderTimelineProps {
  status: OrderStatus;
}

export function OrderTimeline({ status }: OrderTimelineProps) {
  if (["cancelled", "returned"].includes(status)) {
    return (
      <div className="text-center py-4">
        <span className="text-red-600 font-medium capitalize">{status}</span>
      </div>
    );
  }

  const currentIndex = ORDER_INDEX[status] ?? 0;

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        return (
          <div key={step.status} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              {done ? (
                <CheckCircle className="h-6 w-6 text-brand-500 fill-brand-50" />
              ) : (
                <Circle className="h-6 w-6 text-[var(--color-border)]" />
              )}
              <span className={`text-xs text-center w-16 ${done ? "text-brand-500 font-medium" : "text-[var(--color-text-muted)]"}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 mb-5 ${
                  i < currentIndex ? "bg-brand-500" : "bg-[var(--color-border)]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
