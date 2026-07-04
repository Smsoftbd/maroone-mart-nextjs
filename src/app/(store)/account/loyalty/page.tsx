"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { LoyaltyWidget } from "@/components/account/LoyaltyWidget";
import { useAuthStore } from "@/lib/stores/authStore";
import { getLoyalty } from "@/lib/api/customer";
import { useT } from "@/lib/i18n/I18nProvider";
import type { LoyaltyData } from "@/lib/api/types";

export default function LoyaltyPage() {
  const { token } = useAuthStore();
  const t = useT();
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getLoyalty(token)
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!data) return <p className="text-[var(--color-text-muted)]">{t("loyalty_unavailable", "Loyalty program not available.")}</p>;

  return (
    <div>
      <h2 className="font-display text-xl font-semibold mb-6">{t("loyalty_points", "Loyalty Points")}</h2>
      <LoyaltyWidget data={data} />
    </div>
  );
}
