"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
import { useT } from "@/lib/i18n/I18nProvider";

interface CouponInputProps {
  orderTotal: number;
  currency: string;
  onApply: (code: string, discountAmount: number) => void;
}

export function CouponInput({ orderTotal, currency, onApply }: CouponInputProps) {
  const t = useT();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [applied, setApplied] = useState<{
    code: string;
    amount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!code.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), order_total: orderTotal }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setError(data.error || "Invalid coupon code.");
        return;
      }
      setApplied({ code: data.code, amount: data.discount_amount });
      onApply(data.code, data.discount_amount);
    } catch {
      setError("Failed to validate coupon. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (applied) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl">
        <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800">
            Coupon {applied.code} applied!
          </p>
          <p className="text-xs text-green-600">
            You saved {formatPrice(applied.amount, currency)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setApplied(null);
            setCode("");
            onApply("", 0);
          }}
          className="text-xs text-green-700 hover:text-green-900 underline"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={t("coupon_code", "Coupon code")}
          aria-label={t("coupon_code", "Coupon code")}
          className="checkout-input min-w-0 flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApply();
            }
          }}
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={isLoading}
          className="shrink-0 rounded-[var(--shape-input-radius,8px)] bg-[var(--color-brand-500)] px-5 text-sm font-semibold text-[var(--color-primary-text)] transition-colors hover:bg-[var(--color-button-primary-hover-bg,var(--color-brand-600))] disabled:opacity-60"
        >
          {t("apply", "Apply")}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
