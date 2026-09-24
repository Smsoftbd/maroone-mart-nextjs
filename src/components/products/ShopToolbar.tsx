"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useT } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils/cn";
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS } from "@/lib/utils/shop";


type View = "grid" | "list";
const VIEW_KEY = "shop-view";

function GridIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="currentColor" aria-hidden>
      {[0, 5, 10].flatMap((y) => [0, 5, 10].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" />))}
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="currentColor" aria-hidden>
      {[0, 5, 10].map((y) => (
        <rect key={y} x="0" y={y} width="14" height="3" />
      ))}
    </svg>
  );
}

/**
 * Grey bar above the shop grid, like the reference storefront:
 * "View as" grid/list switch on the left, "Items per page" and "Sort by"
 * selects on the right. The view is a per-visitor preference.
 */
export function ShopToolbar() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>("grid");

  // Apply the remembered view once on the client.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(VIEW_KEY);
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from storage
    if (saved === "list") setView("list");
  }, []);

  useEffect(() => {
    document.querySelector(".shop-results")?.setAttribute("data-view", view);
  }, [view]);

  const choose = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {}
  };

  const push = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products", { scroll: false });
  };

  const perPage = searchParams.get("per_page") || String(DEFAULT_PER_PAGE);
  const sort = searchParams.get("sort") || "";
  const sortOptions = [
    { label: t("sort_featured", "Featured"), value: "" },
    { label: t("sort_best_selling", "Best Selling"), value: "sales" },
    { label: t("sort_newest", "Newest"), value: "new" },
    { label: t("sort_price_asc", "Price: Low to High"), value: "price_asc" },
    { label: t("sort_price_desc", "Price: High to Low"), value: "price_desc" },
    { label: t("sort_top_rated", "Top Rated"), value: "rating" },
  ];

  return (
    <div className="shop-toolbar">
      <div className="shop-toolbar-group max-sm:hidden">
        <span className="shop-toolbar-label">{t("view_as", "View as")}</span>
        <div className="flex">
          <button
            type="button"
            onClick={() => choose("grid")}
            aria-pressed={view === "grid"}
            aria-label={t("grid_view", "Grid view")}
            className={cn("shop-view-btn", view === "grid" && "is-active")}
          >
            <GridIcon />
          </button>
          <button
            type="button"
            onClick={() => choose("list")}
            aria-pressed={view === "list"}
            aria-label={t("list_view", "List view")}
            className={cn("shop-view-btn", view === "list" && "is-active")}
          >
            <ListIcon />
          </button>
        </div>
      </div>

      <div className="shop-toolbar-group ml-auto">
        <label className="shop-toolbar-label max-md:hidden" htmlFor="shop-per-page">
          {t("items_per_page", "Items per page")}
        </label>
        <span className="shop-toolbar-select w-[80px] max-md:hidden">
          <select id="shop-per-page" value={perPage} onChange={(e) => push("per_page", e.target.value)}>
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
        </span>

        <label className="shop-toolbar-label ml-[30px] max-md:ml-0" htmlFor="shop-sort">
          {t("sort_by", "Sort by")}
        </label>
        <span className="shop-toolbar-select w-[170px]">
          <select id="shop-sort" value={sort} onChange={(e) => push("sort", e.target.value)}>
            {sortOptions.map((o) => (
              <option key={o.value || "default"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
        </span>
      </div>
    </div>
  );
}
