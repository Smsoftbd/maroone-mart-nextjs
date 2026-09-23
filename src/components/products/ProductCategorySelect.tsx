"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useT } from "@/lib/i18n/I18nProvider";
import type { Category } from "@/lib/api/types";

/** Flattened tree, indented so children read as children in a native select. */
function flatten(cats: Category[], depth = 0): { slug: string; label: string }[] {
  return cats.flatMap((c) => [
    { slug: c.slug, label: `${"  ".repeat(depth)}${c.name}` },
    ...(c.children?.length ? flatten(c.children, depth + 1) : []),
  ]);
}

/**
 * The category dropdown above the shop grid. Single-select, mirroring the
 * `category` query param the sidebar also writes.
 */
export function ProductCategorySelect({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const current = searchParams.get("category") ?? "";
  const options = flatten(categories);

  const select = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (slug) params.set("category", slug);
    else params.delete("category");
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products", { scroll: false });
  };

  return (
    <div className="shop-select relative">
      <select
        value={current}
        onChange={(e) => select(e.target.value)}
        aria-label={t("category", "Category")}
        className="min-w-0 flex-1 cursor-pointer appearance-none truncate bg-transparent pr-1 text-inherit uppercase outline-none"
      >
        <option value="">{t("all_categories", "All Categories")}</option>
        {options.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
    </div>
  );
}
