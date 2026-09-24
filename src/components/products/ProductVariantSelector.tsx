"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { useTheme } from "@/components/providers/StoreConfigProvider";
import type { Barcode } from "@/lib/api/types";

interface ProductVariantSelectorProps {
  barcodes: Barcode[];
  onChange: (barcode: Barcode) => void;
}

const isHexColor = (code: string) => /^#[0-9a-fA-F]{3,6}$/.test(code);

/** Option pickers; product.variant_style = buttons | pills | dropdown. */
export function ProductVariantSelector({
  barcodes,
  onChange,
}: ProductVariantSelectorProps) {
  const style = useTheme().product.variant_style;
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
    <div className="product-size space-y-[22px]">
      {attributeGroups.map(({ name, entries }) => {
        const current = entries.find((e) => e.value === selected[name]);
        return (
          <div key={name}>
            <p className="pdp-label">
              <span className="capitalize">{name}</span> <span className="text-[var(--color-brand-500)]">*</span>
              {current && isHexColor(current.code) && (
                <span className="ml-1.5 font-normal text-[var(--color-text-secondary)]">{current.label}</span>
              )}
            </p>
            {style === "dropdown" ? (
              <select
                value={selected[name] ?? ""}
                onChange={(e) => e.target.value && handleSelect(name, e.target.value)}
                aria-label={name}
                className="input input-shape mt-2.5 h-10 w-full max-w-xs px-3 text-sm"
              >
                <option value="" disabled>
                  — select
                </option>
                {entries.map(({ value, label }) => (
                  <option key={value} value={value} disabled={isOutOfStock(name, value)}>
                    {label}
                    {isOutOfStock(name, value) ? " (out of stock)" : ""}
                  </option>
                ))}
              </select>
            ) : (
            <div className="pdp-variants">
              {entries.map(({ value, code, label }) => {
                const oos = isOutOfStock(name, value);
                const active = selected[name] === value;

                if (isHexColor(code)) {
                  return (
                    <button
                      key={value}
                      title={oos ? `${label} (out of stock)` : label}
                      onClick={() => !oos && handleSelect(name, value)}
                      disabled={oos}
                      className={cn(
                        "relative h-9 w-9 rounded-full p-0.5 ring-1 transition-all",
                        active
                          ? "ring-2 ring-brand-500"
                          : "ring-[var(--color-border-dark)] hover:ring-[var(--color-text-secondary)]",
                        oos && "opacity-40 cursor-not-allowed"
                      )}
                      aria-pressed={active}
                      aria-label={label}
                    >
                      <span
                        className="block h-full w-full rounded-full border border-black/10"
                        style={{ backgroundColor: code }}
                      />
                      {oos && (
                        <span className="absolute inset-0 m-auto h-px w-full rotate-45 bg-[var(--color-text-secondary)]" />
                      )}
                    </button>
                  );
                }

                return (
                  <button
                    key={value}
                    onClick={() => !oos && handleSelect(name, value)}
                    disabled={oos}
                    className={cn(
                      "pdp-variant",
                      style !== "pills" && "is-square",
                      active && "is-active",
                      oos && "is-oos"
                    )}
                    aria-pressed={active}
                    aria-disabled={oos}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
