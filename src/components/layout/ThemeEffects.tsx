"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Toaster, type ToastPosition } from "react-hot-toast";
import { useTheme } from "@/components/providers/StoreConfigProvider";

const PHONE = "(max-width: 640px)";

function subscribePhone(cb: () => void) {
  const mq = window.matchMedia(PHONE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Runtime parts of the Appearance theme that CSS alone can't do:
 * - toasts at effects.toast_position (the matching center position on phones)
 * - effects.page_fade: fades <main> in on every client navigation
 */
export function ThemeEffects() {
  const { effects } = useTheme();
  const pathname = usePathname();
  const first = useRef(true);
  const isPhone = useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE).matches, () => false);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!effects.page_fade || reducedMotion()) return;
    document
      .getElementById("main-content")
      ?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: "ease-out" });
  }, [pathname, effects.page_fade]);

  const position = (
    isPhone ? effects.toast_position.replace("right", "center") : effects.toast_position
  ) as ToastPosition;

  return (
    <Toaster
      position={position}
      toastOptions={{
        style: {
          fontFamily: "var(--font-body)",
          fontSize: "14px",
          background: "var(--color-misc-tooltip-bg, var(--color-surface))",
          color: "var(--color-misc-tooltip-text, var(--color-text-primary))",
          borderRadius: "var(--shape-radius, 8px)",
        },
      }}
    />
  );
}
