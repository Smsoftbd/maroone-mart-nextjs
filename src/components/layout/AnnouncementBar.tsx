"use client";

import { Fragment, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useTheme } from "@/components/providers/StoreConfigProvider";

interface AnnouncementBarProps {
  message?: string;
  /**
   * "header": the site-wide bar under the header (skipped on the homepage,
   * which shows it under the hero banner instead). "hero": the homepage one.
   */
  placement?: "header" | "hero";
}

const noopSubscribe = () => () => {};

/** Plain-text items of the offer message: split on "|", "•" or line breaks. */
function toItems(message: string): string[] {
  const text = message
    .replace(/<br\s*\/?>|<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
  return text.split(/[|\n•]/).map((s) => s.trim()).filter(Boolean);
}

/**
 * Offer bar (page.announcement_bar / announcement_style). The marquee is the
 * Marooned black strip: bold uppercase items with bullets between them,
 * scrolling endlessly; the static style is a dismissible centered line.
 */
export function AnnouncementBar({ message, placement = "header" }: AnnouncementBarProps) {
  const { page } = useTheme();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  // Read once on the client; SSR/hydration renders the bar.
  const dismissedEarlier = useSyncExternalStore(
    noopSubscribe,
    () => sessionStorage.getItem("announcement-dismissed") === "1",
    () => false
  );

  if (!page.announcement_bar || !message) return null;
  if (placement === "header" && pathname === "/") return null;

  if (page.announcement_style === "marquee") {
    const items = toItems(message);
    if (!items.length) return null;
    // Enough copies to overfill a wide screen; the track is doubled and
    // shifted by -50% for a seamless loop.
    const run = Array.from({ length: Math.max(1, Math.ceil(8 / items.length)) }, () => items).flat();
    const copy = (hidden?: boolean) => (
      <span className="mr-marquee-copy" aria-hidden={hidden || undefined}>
        {run.map((item, i) => (
          <Fragment key={i}>
            <span className="mr-marquee-dot" aria-hidden>
              •
            </span>
            <span>{item}</span>
          </Fragment>
        ))}
      </span>
    );
    return (
      <div className="announce mr-marquee" role="marquee">
        <div className="mr-marquee-track" style={{ animationDuration: `${run.length * 5}s` }}>
          {copy()}
          {copy(true)}
        </div>
      </div>
    );
  }

  if (dismissed || dismissedEarlier) return null;

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("announcement-dismissed", "1");
  };

  return (
    <div className="announce relative py-2 pl-4 pr-10 text-center text-sm">
      <div dangerouslySetInnerHTML={{ __html: message }} className="inline [&>p]:m-0 [&>p]:inline" />
      <button
        onClick={dismiss}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
        aria-label="Dismiss announcement"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
