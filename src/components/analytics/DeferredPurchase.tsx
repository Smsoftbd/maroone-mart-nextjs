"use client";

import { useEffect } from "react";
import { trackDeferredPurchase } from "@/lib/analytics/track";

/** Browser half of a gateway order's Purchase, fired once payment succeeded. */
export function DeferredPurchase({ orderId }: { orderId: string }) {
  useEffect(() => {
    trackDeferredPurchase(orderId);
  }, [orderId]);
  return null;
}
