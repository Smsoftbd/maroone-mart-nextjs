"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { clearMetaUserData, getMetaUserData, setMetaUserData } from "@/lib/analytics/meta";
import { buildMetaUserData } from "@/lib/analytics/meta-shared";
import { gtmEvents, setGtmUserData } from "@/lib/analytics/gtm";

export function GtmEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const lastUrl = useRef<string | null>(null);

  // Keep enhanced-conversion data in sync with the signed-in customer.
  // Declared before the page_view effect so user_data is in the dataLayer first.
  const customer = useAuthStore((s) => s.customer);
  const hadCustomer = useRef(false);
  useEffect(() => {
    if (customer) {
      hadCustomer.current = true;
      setMetaUserData(buildMetaUserData(customer));
      setGtmUserData(getMetaUserData());
    } else if (hadCustomer.current) {
      // Explicit logout — don't attribute the next shopper on this device to them.
      hadCustomer.current = false;
      clearMetaUserData();
      setGtmUserData(null);
    } else {
      // Guest: restore keys learned earlier (checkout form, newsletter, …).
      setGtmUserData(getMetaUserData());
    }
  }, [customer]);

  // page_view on every client-side navigation (App Router never reloads the page).
  // Disable automatic page views on the GA4 Google tag and trigger on this event.
  useEffect(() => {
    const url = `${pathname}?${search}`;
    if (lastUrl.current === url) return; // StrictMode double-run guard
    lastUrl.current = url;
    gtmEvents.pageView();

    const q = new URLSearchParams(search).get("search")?.trim();
    if (pathname === "/products" && q) gtmEvents.search(q);
  }, [pathname, search]);

  return null;
}
