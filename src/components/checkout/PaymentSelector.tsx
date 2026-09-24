"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PaymentMethod } from "@/lib/api/types";
import { resolveL10n } from "@/lib/utils/l10n";
import { cn } from "@/lib/utils/cn";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_API_KEY!;
const DEFAULT_ICON = "/images/payment/default.png";

// Backend sends a generic no_image placeholder when no icon is set.
function iconFor(method: PaymentMethod) {
  return method.icon && !method.icon.includes("no_image") ? method.icon : DEFAULT_ICON;
}

interface PaymentSelectorProps {
  value: string;
  onChange: (method: PaymentMethod) => void;
  /** Called once with the fetched list, so the parent can adapt (e.g. hide the Payment step). */
  onLoad?: (methods: PaymentMethod[]) => void;
}

/**
 * Payment methods as one bordered list: a radio row per method (logo right)
 * and the chosen method's instructions in a grey panel under it.
 */
export function PaymentSelector({ value, onChange, onLoad }: PaymentSelectorProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/payment-methods`, {
      headers: { "X-Api-Key": PUBLIC_KEY, Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((data) => {
        const list: PaymentMethod[] = data.data || [];
        setMethods(list);
        onLoad?.(list);
        if (list.length === 1) onChange(list[0]);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="co-options">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-[48px] rounded-none" />
        ))}
      </div>
    );
  }

  return (
    <div className="co-options" role="radiogroup">
      {methods.map((method) => {
        const displayName = resolveL10n(method.name);
        const selected = value === displayName;
        const note = method.description ? resolveL10n(method.description) : "";
        const icon = iconFor(method);
        return (
          <div key={method.id} className="contents">
            <label className={cn("co-option", selected && "is-active")}>
              <input
                type="radio"
                name="payment"
                className={cn("co-radio", methods.length === 1 && "sr-only")}
                checked={selected}
                onChange={() => onChange(method)}
              />
              <span className="min-w-0 flex-1 truncate font-medium">{displayName}</span>
              {icon !== DEFAULT_ICON && (
                <Image src={icon} alt="" width={38} height={24} className="h-6 w-auto shrink-0 object-contain" />
              )}
            </label>
            {selected && note && <div className="co-option-panel">{note}</div>}
          </div>
        );
      })}
    </div>
  );
}
