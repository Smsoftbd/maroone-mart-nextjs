"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import { useT } from "@/lib/i18n/I18nProvider";

interface CartSummaryProps {
  subTotal: number;
  currency: string;
  totalItems: number;
  onClose?: () => void;
}

export function CartSummary({
  subTotal,
  currency,
  totalItems,
  onClose,
}: CartSummaryProps) {
  const disabled = totalItems === 0;
  const t = useT();

  return (
    <div className="w-full p-4 bg-surface-50 border-t border-[var(--color-border)] flex gap-6 justify-between items-center">
      <div className="text-center shrink-0">
        <p className="text-[var(--color-text-secondary)]">{t("total", "Total")}:</p>
        <h3 className="text-[var(--color-text-primary)] font-bold text-lg">
          {formatPrice(subTotal, currency)}
        </h3>
      </div>
      <Link
        href="/checkout"
        onClick={disabled ? undefined : onClose}
        aria-disabled={disabled}
        className={cn(
          "py-3 px-3 md:px-6 w-full md:w-[276px] text-center active:scale-95 rounded-lg",
          "inline-flex items-center justify-center gap-2 font-medium",
          "bg-brand-500 text-[var(--color-primary-text)] hover:bg-brand-600 transition-colors",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        <span>{t("checkout_now", "Checkout now")}</span>
        <ArrowRight className="h-5 w-5" />
      </Link>
    </div>
  );
}
