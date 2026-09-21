"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPrice } from "@/lib/utils/format";
import type { DeliveryCharge } from "@/lib/api/types";
import { resolveL10n } from "@/lib/utils/l10n";

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
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3" role="radiogroup">
      {charges.map((charge) => {
        const displayName = resolveL10n(charge.zone_name);
        const cost = parseFloat(charge.charge_amount);
        const selected = methodName === displayName;
        return (
          <label
            key={charge.id}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border cursor-pointer transition-all ${
              selected
                ? "border-brand-500 ring-1 ring-brand-500 bg-brand-50/60"
                : "border-[var(--color-border)] hover:border-[var(--color-border-dark)] hover:bg-surface-50"
            }`}
          >
            <input
              type="radio"
              name="delivery"
              className="sr-only"
              checked={selected}
              onChange={() => onChange(charge)}
            />
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                selected ? "border-brand-500 bg-brand-500" : "border-[var(--color-border-dark)]"
              }`}
              aria-hidden
            >
              {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{displayName}</p>
              {charge.free_delivery_above && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Free above {formatPrice(parseFloat(charge.free_delivery_above), currency)}
                </p>
              )}
            </div>
            <span className={`text-sm font-semibold tabular-nums ${cost === 0 ? "text-green-600" : ""}`}>
              {cost === 0 ? "Free" : formatPrice(cost, currency)}
            </span>
          </label>
        );
      })}
    </div>
  );
}
