"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PaymentMethod } from "@/lib/api/types";
import { resolveL10n } from "@/lib/utils/l10n";

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
}

export function PaymentSelector({ value, onChange }: PaymentSelectorProps) {
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
        if (list.length === 1) onChange(list[0]);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-48 rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4" role="radiogroup">
      {methods.map((method) => {
        const displayName = resolveL10n(method.name);
        const selected = value === displayName;
        return (
          <label
            key={method.id}
            className={`relative flex h-28 w-48 flex-col justify-end gap-2 rounded-md border px-4 py-3 cursor-pointer transition-colors ${
              selected
                ? "border-brand-500 bg-brand-500/5"
                : "border-[var(--color-border)] hover:border-[var(--color-border-dark)]"
            }`}
          >
            <input
              type="radio"
              name="payment"
              className="sr-only"
              checked={selected}
              onChange={() => onChange(method)}
            />
            <span
              className={`absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border bg-surface transition-colors ${
                selected ? "border-brand-500" : "border-[var(--color-border-dark)]"
              }`}
              aria-hidden
            >
              {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />}
            </span>
            <Image
              src={iconFor(method)}
              alt=""
              width={32}
              height={24}
              className="h-6 w-auto object-contain self-start"
            />
            <span className="text-[15px]">{displayName}</span>
          </label>
        );
      })}
    </div>
  );
}
