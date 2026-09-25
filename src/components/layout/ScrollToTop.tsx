"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/providers/StoreConfigProvider";

/** Back-to-top arrow, bottom right (page.back_to_top); appears after scrolling a screen. */
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
      className={`scroll-to-top mr-scroll-top ${visible ? "is-visible" : ""}`}
    >
      <svg viewBox="0 0 24 24" height="20" width="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3h14M12 21V8M7 12l5-5 5 5" />
      </svg>
    </button>
  );
}
