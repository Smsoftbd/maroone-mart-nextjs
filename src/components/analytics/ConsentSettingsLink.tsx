"use client";

import { CONSENT_OPEN_EVENT } from "@/lib/analytics/consent";

/** Reopens the consent banner. Render only when CONSENT_BANNER is on. */
export function ConsentSettingsLink({ label, className }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
      className={className}
    >
      {label}
    </button>
  );
}
