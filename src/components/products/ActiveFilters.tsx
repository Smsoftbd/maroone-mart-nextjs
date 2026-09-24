"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n/I18nProvider";
import type { Category, Brand, FilterAttribute } from "@/lib/api/types";

interface ActiveFiltersProps {
  categories: Category[];
  brands: Brand[];
  filterAttributes: FilterAttribute[];
  currency: string;
}

interface Chip {
  key: string;
  value: string; // the exact param value to remove (empty for scalar params)
  label: string;
}

function flattenCategories(cats: Category[], acc: Record<string, string> = {}) {
  for (const c of cats) {
    acc[c.slug] = c.name;
    if (c.children?.length) flattenCategories(c.children, acc);
  }
  return acc;
}

export function ActiveFilters({
  categories,
  brands,
  filterAttributes,
  currency,
}: ActiveFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();

  const catNames = flattenCategories(categories);
  const brandNames = Object.fromEntries(brands.map((b) => [String(b.id), b.name]));
  const valueNames = Object.fromEntries(
    filterAttributes.flatMap((a) => a.values.map((v) => [String(v.id), v.value]))
  );

  const chips: Chip[] = [];

  const search = searchParams.get("search");
  if (search) chips.push({ key: "search", value: "", label: `"${search}"` });

  searchParams.getAll("category").forEach((slug) =>
    chips.push({ key: "category", value: slug, label: catNames[slug] ?? slug })
  );
  searchParams.getAll("brands").forEach((id) =>
    chips.push({ key: "brands", value: id, label: brandNames[id] ?? `Brand ${id}` })
  );
  searchParams.getAll("attribute_values").forEach((id) =>
    chips.push({ key: "attribute_values", value: id, label: valueNames[id] ?? id })
  );

  const pMin = searchParams.get("price_min");
  const pMax = searchParams.get("price_max");
  if (pMin || pMax) {
    chips.push({
      key: "__price",
      value: "",
      label: `${currency}${pMin ?? "0"} – ${pMax ? currency + pMax : "∞"}`,
    });
  }

  if (chips.length === 0) return null;

  const remove = (chip: Chip) => {
    const params = new URLSearchParams(searchParams.toString());
    if (chip.key === "__price") {
      params.delete("price_min");
      params.delete("price_max");
    } else if (chip.value) {
      const kept = params.getAll(chip.key).filter((v) => v !== chip.value);
      params.delete(chip.key);
      kept.forEach((v) => params.append(chip.key, v));
    } else {
      params.delete(chip.key);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products", { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pt-5">
      {chips.map((chip) => (
        <button
          key={`${chip.key}:${chip.value}`}
          onClick={() => remove(chip)}
          aria-label={`${t("remove", "Remove")} ${chip.label}`}
          className="group inline-flex items-center gap-1.5 rounded bg-slate-100 py-1 pl-2 pr-1.5 text-xs text-slate-800 transition-colors hover:bg-slate-200"
        >
          {chip.label}
          <X className="h-4 w-4 text-red-500" />
        </button>
      ))}
    </div>
  );
}
