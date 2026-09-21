"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  clearMetaUserData,
  metaEvents,
  setMetaUserData,
  sharedEventId,
  trackMeta,
} from "@/lib/analytics/meta";
import { buildMetaUserData } from "@/lib/analytics/meta-shared";

export function MetaPixelEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const lastUrl = useRef<string | null>(null);

  // PageView on every client-side navigation (App Router never reloads the page).
  useEffect(() => {
    const url = `${pathname}?${search}`;
    if (lastUrl.current === url) return; // StrictMode double-run guard
    lastUrl.current = url;
    // Same ids as GtmEvents' page_view/search for this URL (server-side GTM dedupe).
    trackMeta("PageView", {}, { eventId: sharedEventId("PageView", url) });

    const q = new URLSearchParams(search).get("search")?.trim();
    if (pathname === "/products" && q) metaEvents.search(q, sharedEventId("Search", url));
  }, [pathname, search]);

  // Keep advanced-matching keys in sync with the signed-in customer.
  const customer = useAuthStore((s) => s.customer);
  const hadCustomer = useRef(false);
  useEffect(() => {
    if (customer) {
      hadCustomer.current = true;
      setMetaUserData(buildMetaUserData(customer));
    } else if (hadCustomer.current) {
      // Explicit logout — don't attribute the next shopper on this device to them.
      hadCustomer.current = false;
      clearMetaUserData();
    }
  }, [customer]);

  return null;
}
