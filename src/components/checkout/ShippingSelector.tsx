"use client";

import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPrice } from "@/lib/utils/format";
import type { DeliveryCharge } from "@/lib/api/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_API_KEY!;

interface ShippingSelectorProps {
  currency: string;
  methodName: string;
  onChange: (charge: DeliveryCharge) => void;
}

export function ShippingSelector({
  currency,
  methodName,
  onChange,
}: ShippingSelectorProps) {
  const [charges, setCharges] = useState<DeliveryCharge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/delivery-charges`, {
      headers: { "X-Api-Key": PUBLIC_KEY, Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((data) => setCharges(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {charges.map((charge) => (
        <label
          key={charge.id}
          className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
            methodName === charge.name
              ? "border-brand-500 bg-brand-50"
              : "border-[var(--color-border)] hover:border-brand-300"
          }`}
        >
          <input
            type="radio"
            name="delivery"
            className="accent-brand-500"
            checked={methodName === charge.name}
            onChange={() => onChange(charge)}
          />
          <Truck className="h-4 w-4 text-[var(--color-text-muted)]" />
          <div className="flex-1">
            <span className="text-sm font-medium">{charge.name}</span>
            {charge.estimated_days && (
              <span className="text-xs text-[var(--color-text-muted)] ml-2">
                {charge.estimated_days} day{charge.estimated_days !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <span className="text-sm font-bold">
            {charge.cost === 0 ? "Free" : formatPrice(charge.cost, currency)}
          </span>
        </label>
      ))}
    </div>
  );
}
