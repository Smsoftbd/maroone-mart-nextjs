"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthStore } from "@/lib/stores/authStore";
import { getReturns } from "@/lib/api/customer";
import { formatDate } from "@/lib/utils/format";
import type { ReturnRequest } from "@/lib/api/types";

const statusVariant = (s: string) =>
  s === "approved" ? "success" : s === "rejected" || s === "cancelled" ? "error" : "warning";

export default function ReturnsPage() {
  const { token } = useAuthStore();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getReturns(token)
      .then((res) => setReturns(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  if (returns.length === 0) {
    return (
      <EmptyState
        icon={RotateCcw}
        title="No returns"
        description="Your return requests will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold">Returns & Refunds</h2>
      {returns.map((ret) => (
        <div key={ret.id} className="bg-white border border-[var(--color-border)] rounded-xl p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-medium">Return #{ret.id}</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Order #{ret.order_id} · {formatDate(ret.created_at)}
              </p>
            </div>
            <Badge variant={statusVariant(ret.status)}>
              {ret.status}
            </Badge>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">{ret.reason}</p>
        </div>
      ))}
    </div>
  );
}
