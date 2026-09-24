"use client";

import { useCountdown } from "@/lib/hooks/useCountdown";
import { cn } from "@/lib/utils/cn";

interface CountdownProps {
  endsAt: string;
  className?: string;
}

function Segment({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-body font-bold text-2xl tabular-nums min-w-[2.5rem] text-center rounded-[var(--shape-radius,0.375rem)] bg-[var(--color-commerce-countdown-bg,transparent)] text-[var(--color-commerce-countdown-text,inherit)] px-1.5 py-0.5">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-xs uppercase tracking-widest opacity-70">{label}</span>
    </div>
  );
}

function Colon() {
  return <span className="font-bold text-2xl self-start pt-0.5 opacity-70">:</span>;
}

export function Countdown({ endsAt, className }: CountdownProps) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(endsAt);

  if (isExpired) return null;

  return (
    <div className={cn("flex items-center gap-2", className)} aria-live="polite">
      <Segment value={days} label="Days" />
      <Colon />
      <Segment value={hours} label="Hrs" />
      <Colon />
      <Segment value={minutes} label="Min" />
      <Colon />
      <Segment value={seconds} label="Sec" />
    </div>
  );
}
