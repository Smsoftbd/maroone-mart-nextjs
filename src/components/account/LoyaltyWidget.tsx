"use client";

import { Star } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { LoyaltyData } from "@/lib/api/types";

export function LoyaltyWidget({ data }: { data: LoyaltyData }) {
  const { t, locale } = useI18n();
  return (
    <div className="space-y-6">
      {/* Balance card */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Star className="h-5 w-5 fill-current" />
          <span className="text-sm font-medium uppercase tracking-wide">{t("loyalty_points", "Loyalty Points")}</span>
        </div>
        <p className="font-display text-4xl font-bold">{data.balance}</p>
        <p className="text-sm text-white/70 mt-1">
          ≈ {data.balance * data.point_value} value
        </p>
        {data.can_redeem && (
          <p className="mt-3 text-xs bg-white/20 rounded-lg px-3 py-1.5 inline-block">
            Redeeemable at checkout
          </p>
        )}
      </div>

      {/* Transactions */}
      {data.transactions.length > 0 && (
        <div>
          <h3 className="font-display font-semibold mb-3">{t("transaction_history", "Transaction History")}</h3>
          <div className="divide-y divide-[var(--color-border)]">
            {data.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {formatDate(tx.created_at, locale)}
                  </p>
                </div>
                <span
                  className={`font-bold text-sm ${
                    tx.type === "earn" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {tx.type === "earn" ? "+" : "-"}
                  {tx.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
