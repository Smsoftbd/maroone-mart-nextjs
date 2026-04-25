"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import type { Barcode } from "@/lib/api/types";

interface ProductVariantSelectorProps {
  barcodes: Barcode[];
  onChange: (barcode: Barcode) => void;
}

export function ProductVariantSelector({
  barcodes,
  onChange,
}: ProductVariantSelectorProps) {
  const [selected, setSelected] = useState<Record<string, string>>({});

  // Collect all unique attribute types and their values
  const attributeGroups = useMemo(() => {
    const groups: Record<string, Set<string>> = {};
    barcodes.forEach((b) => {
      b.attributes.forEach(({ name, value }) => {
        if (!groups[name]) groups[name] = new Set();
        groups[name].add(value);
      });
    });
    return Object.entries(groups).map(([name, values]) => ({
      name,
      values: [...values],
    }));
  }, [barcodes]);

  if (attributeGroups.length === 0) return null;

  const handleSelect = (attrName: string, value: string) => {
    const next = { ...selected, [attrName]: value };
    setSelected(next);

    // Find barcode matching all selected attributes
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
    <div className="space-y-4">
      {attributeGroups.map(({ name, values }) => (
        <div key={name}>
          <p className="text-sm font-medium mb-2">
            {name}:{" "}
            <span className="text-[var(--color-text-muted)] font-normal">
              {selected[name] || "Select"}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {values.map((value) => {
              const oos = isOutOfStock(name, value);
              const active = selected[name] === value;
              return (
                <button
                  key={value}
                  onClick={() => !oos && handleSelect(name, value)}
                  disabled={oos}
                  className={cn(
                    "px-4 py-2 text-sm rounded-lg border-2 transition-colors",
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-600 font-medium"
                      : "border-[var(--color-border)] hover:border-brand-300",
                    oos &&
                      "opacity-40 cursor-not-allowed line-through decoration-[var(--color-text-muted)]"
                  )}
                  aria-pressed={active}
                  aria-disabled={oos}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
