"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/providers/StoreConfigProvider";

/** Floating back-to-top button (page.back_to_top); appears after scrolling a screen. */
export function ScrollToTop() {
  const { page } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!page.back_to_top) return;
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [page.back_to_top]);

  if (!page.back_to_top) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      tabIndex={visible ? 0 : -1}
      className={`scroll-to-top fixed right-5 bottom-5 z-40 inline-flex h-[43px] w-[43px] items-center justify-center rounded-full bg-brand-500 text-[var(--color-primary-text)] shadow-lg transition-all hover:-translate-y-0.5 ${
        visible ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <svg viewBox="0 0 24 24" height="20" width="20" fill="currentColor">
        <path d="M6 4h12v2H6zm.707 11.707L11 11.414V20h2v-8.586l4.293 4.293 1.414-1.414L12 7.586l-6.707 6.707z" />
      </svg>
    </button>
  );
}
