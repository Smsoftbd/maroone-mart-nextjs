"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CreditCard } from "lucide-react";
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
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {methods.map((method) => {
        const displayName = resolveL10n(method.name);
        return (
          <label
            key={method.id}
            className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
              value === displayName
                ? "border-brand-500 bg-brand-50"
                : "border-[var(--color-border)] hover:border-brand-300"
            }`}
          >
            <input
              type="radio"
              name="payment"
              className="accent-brand-500"
              checked={value === displayName}
              onChange={() => onChange(method)}
            />
            {method.icon ? (
              <Image
                src={method.icon}
                alt={displayName}
                width={32}
                height={20}
                className="object-contain"
              />
            ) : (
              <CreditCard className="h-5 w-5 text-[var(--color-text-muted)]" />
            )}
            <span className="text-sm font-medium">{displayName}</span>
          </label>
        );
      })}
    </div>
  );
}
