"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPrice } from "@/lib/utils/format";
import type { DeliveryCharge } from "@/lib/api/types";
import { resolveL10n } from "@/lib/utils/l10n";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/lib/i18n/I18nProvider";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_API_KEY!;

interface ShippingSelectorProps {
  currency: string;
  methodName: string;
  onChange: (charge: DeliveryCharge) => void;
}

/** Delivery zones as the reference's two-column grid of bordered tiles. */
export function ShippingSelector({ currency, methodName, onChange }: ShippingSelectorProps) {
  const t = useT();
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
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-[50px] rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
      {charges.map((charge) => {
        const displayName = resolveL10n(charge.zone_name);
        const cost = parseFloat(charge.charge_amount);
        const selected = methodName === displayName;
        return (
          <label key={charge.id} className={cn("choice-tile cursor-pointer", selected && "is-active")}>
            <input
              type="radio"
              name="delivery"
              className="sr-only"
              checked={selected}
              onChange={() => onChange(charge)}
            />
            <span className="truncate font-medium">{displayName}</span>
            <span className="choice-price shrink-0">
              {cost === 0 ? t("free", "Free") : formatPrice(cost, currency)}
            </span>
          </label>
        );
      })}
    </div>
  );
}
