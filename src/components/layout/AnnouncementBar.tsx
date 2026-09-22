"use client";

import { useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { useTheme } from "@/components/providers/StoreConfigProvider";

interface AnnouncementBarProps {
  message?: string;
}

const noopSubscribe = () => () => {};

/** Offer bar above the header: page.announcement_bar / announcement_style. */
export function AnnouncementBar({ message }: AnnouncementBarProps) {
  const { page } = useTheme();
  const [dismissed, setDismissed] = useState(false);
  // Read once on the client; SSR/hydration renders the bar.
  const dismissedEarlier = useSyncExternalStore(
    noopSubscribe,
    () => sessionStorage.getItem("announcement-dismissed") === "1",
    () => false
  );

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("announcement-dismissed", "1");
  };

  if (!page.announcement_bar || dismissed || dismissedEarlier || !message) return null;

  const text = <div dangerouslySetInnerHTML={{ __html: message }} className="inline [&>p]:m-0 [&>p]:inline" />;

  return (
    <div className="announce relative py-2 pl-4 pr-10 text-center text-sm">
      {page.announcement_style === "marquee" ? (
        <div className="announce-marquee overflow-hidden whitespace-nowrap">
          {/* Two copies, shifted by -50%, make a seamless loop. */}
          <div className="announce-track inline-flex">
            <span className="px-12">{text}</span>
            <span className="px-12" aria-hidden>
              {text}
            </span>
          </div>
        </div>
      ) : (
        text
      )}
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
