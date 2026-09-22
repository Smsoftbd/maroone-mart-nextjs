"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPrice } from "@/lib/utils/format";
import type { DeliveryCharge } from "@/lib/api/types";
import { resolveL10n } from "@/lib/utils/l10n";
import { cn } from "@/lib/utils/cn";

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
      .then((data) => {
        const list: DeliveryCharge[] = data.data || [];
        setCharges(list);
        if (list.length > 0) onChange(list[0]);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="flex gap-6">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-6 w-36 rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-10 gap-y-3" role="radiogroup">
      {charges.map((charge) => {
        const displayName = resolveL10n(charge.zone_name);
        const cost = parseFloat(charge.charge_amount);
        const selected = methodName === displayName;
        return (
          <label key={charge.id} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="delivery"
              className="sr-only"
              checked={selected}
              onChange={() => onChange(charge)}
            />
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border bg-white transition-colors",
                selected ? "border-brand-500" : "border-[var(--color-border-dark)]"
              )}
              aria-hidden
            >
              {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />}
            </span>
            <span className="text-[15px] font-medium">
              {displayName}
              <span className="ml-2 font-semibold tabular-nums">
                {cost === 0 ? "Free" : formatPrice(cost, currency)}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
