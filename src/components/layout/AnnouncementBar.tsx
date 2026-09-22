"use client";

import { useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";

interface AnnouncementBarProps {
  message?: string;
}

const noopSubscribe = () => () => {};

export function AnnouncementBar({ message }: AnnouncementBarProps) {
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

  if (dismissed || dismissedEarlier || !message) return null;

  return (
    <div className="bg-tertiary-500 text-[var(--color-tertiary-text)] text-sm py-2 px-4 text-center relative">
      <div
        dangerouslySetInnerHTML={{ __html: message }}
        className="inline [&>p]:m-0"
      />
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
