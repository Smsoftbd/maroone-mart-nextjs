"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import type { Barcode } from "@/lib/api/types";

interface ProductVariantSelectorProps {
  barcodes: Barcode[];
  onChange: (barcode: Barcode) => void;
}

const isHexColor = (code: string) => /^#[0-9a-fA-F]{3,6}$/.test(code);

export function ProductVariantSelector({
  barcodes,
  onChange,
}: ProductVariantSelectorProps) {
  const [selected, setSelected] = useState<Record<string, string>>({});

  const attributeGroups = useMemo(() => {
    const groups: Record<string, Map<string, { code: string; label: string }>> = {};
    barcodes.forEach((b) => {
      b.attributes.forEach(({ name, value, value_code }) => {
        if (!groups[name]) groups[name] = new Map();
        // `value` is the stable identity (may be a numeric id fallback);
        // prefer a human label when one exists.
        const label = value_code && !isHexColor(value_code) ? value_code : value;
        groups[name].set(value, { code: value_code ?? value, label });
      });
    });
    return Object.entries(groups).map(([name, map]) => ({
      name,
      entries: [...map.entries()].map(([value, { code, label }]) => ({ value, code, label })),
    }));
  }, [barcodes]);

  if (attributeGroups.length === 0) return null;

  const handleSelect = (attrName: string, value: string) => {
    const next = { ...selected, [attrName]: value };
    setSelected(next);

    const match = barcodes.find((b) =>
      Object.entries(next).every(([k, v]) =>
        b.attributes.some((a) => a.name === k && a.value === v)
      )
    );
    if (match) onChange(match);
  };

  const isOutOfStock = (attrName: string, value: string) => {
    const candidate = { ...selected, [attrName]: value };
    return !barcodes.some(
      (b) =>
        b.stock > 0 &&
        Object.entries(candidate).every(([k, v]) =>
          b.attributes.some((a) => a.name === k && a.value === v)
        )
    );
  };

  return (
    <div className="product-size space-y-4">
      {attributeGroups.map(({ name, entries }) => (
        <div key={name}>
          <h4 className="text-slate-900 text-sm lg:text-base font-normal">
            Select {name}:
          </h4>
          <div className="flex gap-2 lg:gap-3 flex-wrap mt-2 lg:mt-3">
            {entries.map(({ value, code, label }) => {
              const oos = isOutOfStock(name, value);
              const active = selected[name] === value;

              if (isHexColor(code)) {
                return (
                  <button
                    key={value}
                    title={label}
                    onClick={() => !oos && handleSelect(name, value)}
                    disabled={oos}
                    style={{ backgroundColor: code }}
                    className={cn(
                      "w-9 h-9 rounded-full border-2 transition-all",
                      active
                        ? "border-brand-500 scale-110 ring-2 ring-brand-200"
                        : "border-transparent hover:border-brand-300",
                      oos && "opacity-40 cursor-not-allowed"
                    )}
                    aria-pressed={active}
                    aria-label={label}
                  />
                );
              }

              return (
                <button
                  key={value}
                  onClick={() => !oos && handleSelect(name, value)}
                  disabled={oos}
                  className={cn(
                    "py-2 lg:py-3 px-4 rounded-lg border text-sm lg:text-base cursor-pointer transition-colors",
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-600 font-medium"
                      : "border-slate-300 text-slate-700 hover:border-brand-300",
                    oos &&
                      "opacity-40 cursor-not-allowed line-through decoration-[var(--color-text-muted)]"
                  )}
                  aria-pressed={active}
                  aria-disabled={oos}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
