"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { useT } from "@/lib/i18n/I18nProvider";

export function ProductSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const current = searchParams.get("sort") || "";

  const sortOptions = [
    { label: t("sort_newest", "Newest"), value: "new" },
    { label: t("sort_price_asc", "Price: Low to High"), value: "price_asc" },
    { label: t("sort_price_desc", "Price: High to Low"), value: "price_desc" },
    { label: t("sort_top_rated", "Top Rated"), value: "rating" },
    { label: t("sort_best_selling", "Best Selling"), value: "sales" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("sort", e.target.value);
    } else {
      params.delete("sort");
    }
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <ArrowUpDown className="h-4 w-4 text-[var(--color-text-muted)]" />
      <select
        value={current}
        onChange={handleChange}
        className="border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        aria-label={t("sort_products", "Sort products")}
      >
        <option value="">{t("default", "Default")}</option>
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
