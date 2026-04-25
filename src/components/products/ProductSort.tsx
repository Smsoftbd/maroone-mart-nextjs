"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

const sortOptions = [
  { label: "Newest", value: "new" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Top Rated", value: "rating" },
  { label: "Best Selling", value: "sales" },
];

export function ProductSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") || "";

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
        aria-label="Sort products"
      >
        <option value="">Default</option>
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
