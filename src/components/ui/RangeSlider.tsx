"use client";

import { useState } from "react";

interface RangeSliderProps {
  /** Absolute catalog bounds. */
  min: number;
  max: number;
  /** Current selection (falls back to bounds when undefined). */
  valueMin?: number;
  valueMax?: number;
  currency?: string;
  /** Fired when the user releases a thumb or commits a number input. */
  onCommit: (min: number | undefined, max: number | undefined) => void;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

export function RangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  currency = "",
  onCommit,
}: RangeSliderProps) {
  const [lo, setLo] = useState(valueMin ?? min);
  const [hi, setHi] = useState(valueMax ?? max);

  // Resync local thumbs when the URL-driven props change (e.g. clear-all),
  // adjusting state during render per React's "storing previous props" pattern.
  const [prev, setPrev] = useState({ valueMin, valueMax, min, max });
  if (
    prev.valueMin !== valueMin ||
    prev.valueMax !== valueMax ||
    prev.min !== min ||
    prev.max !== max
  ) {
    setPrev({ valueMin, valueMax, min, max });
    setLo(valueMin ?? min);
    setHi(valueMax ?? max);
  }

  const range = Math.max(max - min, 1);
  const loPct = ((clamp(lo, min, max) - min) / range) * 100;
  const hiPct = ((clamp(hi, min, max) - min) / range) * 100;

  // Only send bounds that actually narrow the range.
  const commit = (nextLo: number, nextHi: number) =>
    onCommit(nextLo > min ? nextLo : undefined, nextHi < max ? nextHi : undefined);

  if (max <= min) return null;

  return (
    <div className="pt-1">
      <div className="relative h-5">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-surface-100" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-500"
          style={{ left: `${loPct}%`, right: `${100 - hiPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={lo}
          onChange={(e) => setLo(Math.min(Number(e.target.value), hi))}
          onPointerUp={() => commit(lo, hi)}
          onKeyUp={() => commit(lo, hi)}
          aria-label="Minimum price"
          className="range-thumb"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={hi}
          onChange={(e) => setHi(Math.max(Number(e.target.value), lo))}
          onPointerUp={() => commit(lo, hi)}
          onKeyUp={() => commit(lo, hi)}
          aria-label="Maximum price"
          className="range-thumb"
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <PriceInput
          value={lo}
          currency={currency}
          onCommit={(n) => {
            const next = clamp(n, min, hi);
            setLo(next);
            commit(next, hi);
          }}
        />
        <span className="text-[var(--color-text-muted)]">–</span>
        <PriceInput
          value={hi}
          currency={currency}
          onCommit={(n) => {
            const next = clamp(n, lo, max);
            setHi(next);
            commit(lo, next);
          }}
        />
      </div>

    </div>
  );
}

function PriceInput({
  value,
  currency,
  onCommit,
}: {
  value: number;
  currency: string;
  onCommit: (n: number) => void;
}) {
  const [text, setText] = useState(String(value));
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setText(String(value));
  }

  const fire = () => {
    const n = Number(text);
    if (!Number.isNaN(n)) onCommit(Math.round(n));
  };

  return (
    <div className="flex flex-1 items-center gap-1 rounded-lg border border-[var(--color-border)] px-2 py-1.5 focus-within:ring-2 focus-within:ring-brand-500">
      {currency && (
        <span className="text-xs text-[var(--color-text-muted)]">{currency}</span>
      )}
      <input
        type="number"
        inputMode="numeric"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={fire}
        onKeyDown={(e) => e.key === "Enter" && fire()}
        className="w-full min-w-0 bg-transparent text-sm outline-none"
      />
    </div>
  );
}
