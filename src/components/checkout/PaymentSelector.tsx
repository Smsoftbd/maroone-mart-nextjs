"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PaymentMethod } from "@/lib/api/types";
import { resolveL10n } from "@/lib/utils/l10n";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_API_KEY!;

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
      .then((data) => setMethods(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup">
      {methods.map((method) => {
        const displayName = resolveL10n(method.name);
        const selected = value === displayName;
        return (
          <label
            key={method.id}
            className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl border cursor-pointer transition-all ${
              selected
                ? "border-brand-500 ring-1 ring-brand-500 bg-brand-50/60"
                : "border-[var(--color-border)] hover:border-[var(--color-border-dark)] hover:bg-surface-50"
            }`}
          >
            <input
              type="radio"
              name="payment"
              className="sr-only"
              checked={selected}
              onChange={() => onChange(method)}
            />
            <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg bg-white border border-[var(--color-border)]">
              {method.icon ? (
                <Image
                  src={method.icon}
                  alt=""
                  width={36}
                  height={22}
                  className="object-contain"
                />
              ) : (
                <CreditCard className="h-4 w-4 text-[var(--color-text-muted)]" />
              )}
            </span>
            <span className="flex-1 text-sm font-medium">{displayName}</span>
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                selected ? "border-brand-500 bg-brand-500" : "border-[var(--color-border-dark)]"
              }`}
              aria-hidden
            >
              {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </span>
          </label>
        );
      })}
    </div>
  );
}
