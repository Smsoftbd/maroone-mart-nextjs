"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
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
    <div className="w-full p-4 bg-surface-50 border-t border-[var(--color-border)] space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {t("subtotal", "Subtotal")} ({totalItems}{" "}
          {totalItems === 1 ? t("item", "item") : t("items", "items")})
        </p>
        <p className="text-xl font-bold text-[var(--color-text-primary)] tabular-nums">
          {formatPrice(subTotal, currency)}
        </p>
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">
        {t("shipping_at_checkout", "Shipping calculated at checkout.")}
      </p>

      <Link
        href="/checkout"
        onClick={disabled ? undefined : onClose}
        aria-disabled={disabled}
        className={cn(
          "w-full py-3 px-6 rounded-lg active:scale-[0.98]",
          "inline-flex items-center justify-center gap-2 font-semibold",
          "bg-brand-500 text-[var(--color-primary-text)] hover:bg-brand-600 transition-colors",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        <span>{t("checkout_now", "Checkout now")}</span>
        <ArrowRight className="h-5 w-5" />
      </Link>

      {onClose && (
        <button
          onClick={onClose}
          className="w-full py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-brand-ink transition-colors"
        >
          {t("continue_shopping", "Continue shopping")}
        </button>
      )}

      <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)]">
        <ShieldCheck className="h-3.5 w-3.5" />
        {t("secure_checkout", "Secure checkout")}
      </p>
    </div>
  );
}
