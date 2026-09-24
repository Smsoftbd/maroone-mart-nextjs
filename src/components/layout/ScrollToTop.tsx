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
      className={`scroll-to-top fixed right-[60px] bottom-10 max-md:right-4 max-md:bottom-5 z-40 inline-flex h-[43px] w-[43px] items-center justify-center rounded-full bg-brand-500 text-[var(--color-primary-text)] shadow-lg transition-all hover:-translate-y-0.5 ${
        visible ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <svg viewBox="0 0 24 24" height="26" width="26" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="m6 15 6-6 6 6" />
      </svg>
    </button>
  );
}
