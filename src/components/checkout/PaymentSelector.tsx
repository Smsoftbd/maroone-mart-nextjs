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

/** Payment methods as bordered tiles: name and hint left, logo tile right. */
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
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-[72px] rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
      {methods.map((method) => {
        const displayName = resolveL10n(method.name);
        const selected = value === displayName;
        return (
          <label
            key={method.id}
            className={cn("choice-tile cursor-pointer !min-h-[72px]", selected && "is-active")}
          >
            <input
              type="radio"
              name="payment"
              className="sr-only"
              checked={selected}
              onChange={() => onChange(method)}
            />
            <span className="min-w-0">
              <span className="block truncate font-semibold">{displayName}</span>
              {method.description && (
                <span className="mt-0.5 block truncate text-xs text-[var(--color-text-muted)]">
                  {resolveL10n(method.description)}
                </span>
              )}
            </span>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
              <Image
                src={iconFor(method)}
                alt=""
                width={28}
                height={20}
                className="h-5 w-auto object-contain"
              />
            </span>
          </label>
        );
      })}
    </div>
  );
}
