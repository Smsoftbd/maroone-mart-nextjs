"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  clearMetaUserData,
  getMetaUserData,
  setMetaUserData,
  sharedEventId,
} from "@/lib/analytics/meta";
import { buildMetaUserData } from "@/lib/analytics/meta-shared";
import { gtmEvents, setGtmUserData } from "@/lib/analytics/gtm";

/** Longest a page_view waits for the new page's <title> (metadata can stream in late). */
const TITLE_WAIT_MS = 1000;

export function GtmEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const lastUrl = useRef<string | null>(null);
  const flushPending = useRef<(() => void) | null>(null);

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
    const isFirst = lastUrl.current === null;
    lastUrl.current = url;

    // A page_view still waiting for its title goes out now, before the next one.
    flushPending.current?.();

    const pageViewId = sharedEventId("PageView", url);
    const q = new URLSearchParams(search).get("search")?.trim();
    const searchId = q ? sharedEventId("Search", url) : undefined;
    const send = () => {
      gtmEvents.pageView(pageViewId);
      if (pathname === "/products" && q) gtmEvents.search(q, searchId);
    };

    // The first load has its server-rendered title already.
    if (isFirst) {
      send();
      return;
    }

    // Client navigations: wait for the new <title>, or give up after TITLE_WAIT_MS.
    const prevTitle = document.title;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      observer.disconnect();
      clearTimeout(timer);
      flushPending.current = null;
      send();
    };
    const observer = new MutationObserver(() => {
      if (document.title !== prevTitle) finish();
    });
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    const timer = setTimeout(finish, TITLE_WAIT_MS);
    flushPending.current = finish;
  }, [pathname, search]);

  // Don't lose a pending page_view when the tab is closed or hidden.
  useEffect(() => {
    const onHide = () => flushPending.current?.();
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);

  return null;
}
