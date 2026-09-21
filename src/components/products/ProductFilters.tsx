"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Search, SlidersHorizontal } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Checkbox } from "@/components/ui/Checkbox";
import { FilterSection } from "@/components/ui/FilterSection";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { Spinner } from "@/components/ui/Spinner";
import { useT } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils/cn";
import type { Category, Brand, FilterAttribute } from "@/lib/api/types";

interface ProductFiltersProps {
  categories: Category[];
  brands: Brand[];
  filterAttributes: FilterAttribute[];
  priceRange: { min: number; max: number };
  currency: string;
  /** Result count for the current query, shown on the mobile "show results" button. */
  total: number;
  /** Rendered next to the mobile filter button (e.g. the sort control). */
  toolbarSlot?: React.ReactNode;
}

/** Lists longer than this collapse behind a "Show more" toggle. */
const COLLAPSED_LIMIT = 6;
/** Brand lists longer than this get a search box. */
const SEARCHABLE_LIMIT = 8;

function useFilterParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const navigate = (params: URLSearchParams) => {
    params.delete("page");
    const qs = params.toString();
    startTransition(() => router.push(qs ? `/products?${qs}` : "/products", { scroll: false }));
  };

  // Add/remove a single value from a repeatable param.
  const toggle = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const existing = params.getAll(key);
    params.delete(key);
    const next = existing.includes(value)
      ? existing.filter((v) => v !== value)
      : [...existing, value];
    next.forEach((v) => params.append(key, v));
    navigate(params);
  };

  const setPrice = (min: number | undefined, max: number | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (min != null) params.set("price_min", String(min));
    else params.delete("price_min");
    if (max != null) params.set("price_max", String(max));
    else params.delete("price_max");
    navigate(params);
  };

  // Keep the search term and sort order; drop every facet.
  const clearAll = () => {
    const params = new URLSearchParams();
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");
    if (search) params.set("search", search);
    if (sort) params.set("sort", sort);
    navigate(params);
  };

  const active = {
    categories: searchParams.getAll("category"),
    brands: searchParams.getAll("brands"),
    values: searchParams.getAll("attribute_values"),
    priceMin: searchParams.get("price_min"),
    priceMax: searchParams.get("price_max"),
  };
  const activeCount =
    active.categories.length +
    active.brands.length +
    active.values.length +
    (active.priceMin || active.priceMax ? 1 : 0);

  return { active, activeCount, toggle, setPrice, clearAll, isPending };
}

function ShowMore<T>({
  items,
  render,
  isActive,
}: {
  items: T[];
  render: (item: T) => React.ReactNode;
  isActive?: (item: T) => boolean;
}) {
  const t = useT();
  // Start expanded when a selected item would otherwise be hidden.
  const [expanded, setExpanded] = useState(
    () => !!isActive && items.slice(COLLAPSED_LIMIT).some(isActive)
  );
  const visible = expanded ? items : items.slice(0, COLLAPSED_LIMIT);
  const hidden = items.length - COLLAPSED_LIMIT;

  return (
    <div>
      {visible.map(render)}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-1.5 text-xs font-medium text-[var(--color-text-secondary)] underline-offset-4 hover:text-[var(--color-text-primary)] hover:underline"
        >
          {expanded ? t("show_less", "Show less") : `${t("show_more", "Show more")} (${hidden})`}
        </button>
      )}
    </div>
  );
}

function FilterContent({
  categories,
  brands,
  filterAttributes,
  priceRange,
  currency,
  filters,
}: Omit<ProductFiltersProps, "total" | "toolbarSlot"> & {
  filters: ReturnType<typeof useFilterParams>;
}) {
  const t = useT();
  const [brandQuery, setBrandQuery] = useState("");
  const { active, toggle, setPrice } = filters;

  const renderCategory = (cat: Category, depth = 0): React.ReactNode => (
    <div key={cat.id} style={{ paddingLeft: depth ? `${depth * 0.875}rem` : undefined }}>
      <Checkbox
        checked={active.categories.includes(cat.slug)}
        onChange={() => toggle("category", cat.slug)}
        label={cat.name}
      />
      {cat.children?.map((child) => renderCategory(child, depth + 1))}
    </div>
  );

  const hasActiveDescendant = (cat: Category): boolean =>
    active.categories.includes(cat.slug) || !!cat.children?.some(hasActiveDescendant);

  const filteredBrands = brandQuery
    ? brands.filter((b) => b.name.toLowerCase().includes(brandQuery.toLowerCase()))
    : brands;

  return (
    <div>
      {categories.length > 0 && (
        <FilterSection title={t("categories", "Categories")} activeCount={active.categories.length}>
          <ShowMore
            items={categories}
            render={(cat) => renderCategory(cat)}
            isActive={hasActiveDescendant}
          />
        </FilterSection>
      )}

      {priceRange.max > priceRange.min && (
        <FilterSection
          title={t("price", "Price")}
          activeCount={active.priceMin || active.priceMax ? 1 : 0}
        >
          <RangeSlider
            min={priceRange.min}
            max={priceRange.max}
            valueMin={active.priceMin ? Number(active.priceMin) : undefined}
            valueMax={active.priceMax ? Number(active.priceMax) : undefined}
            currency={currency}
            onCommit={setPrice}
          />
        </FilterSection>
      )}

      {brands.length > 0 && (
        <FilterSection title={t("brands", "Brands")} activeCount={active.brands.length}>
          {brands.length > SEARCHABLE_LIMIT && (
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="search"
                value={brandQuery}
                onChange={(e) => setBrandQuery(e.target.value)}
                placeholder={t("search_brands", "Search brands")}
                aria-label={t("search_brands", "Search brands")}
                className="w-full rounded-md border border-[var(--color-border)] bg-transparent py-1.5 pl-8 pr-2 text-sm outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-text-primary)]"
              />
            </div>
          )}
          {filteredBrands.length === 0 ? (
            <p className="py-1.5 text-sm text-[var(--color-text-muted)]">
              {t("no_matches", "No matches")}
            </p>
          ) : (
            <ShowMore
              key={brandQuery}
              items={filteredBrands}
              isActive={(b) => active.brands.includes(String(b.id))}
              render={(brand) => (
                <Checkbox
                  key={brand.id}
                  checked={active.brands.includes(String(brand.id))}
                  onChange={() => toggle("brands", String(brand.id))}
                  label={brand.name}
                />
              )}
            />
          )}
        </FilterSection>
      )}

      {filterAttributes.map((attr) => {
        const count = attr.values.filter((v) => active.values.includes(String(v.id))).length;
        const isColor = attr.code === "color" && attr.values.some((v) => v.code);

        return (
          <FilterSection key={attr.id} title={attr.name} activeCount={count}>
            {isColor ? (
              <div className="flex flex-wrap gap-2.5 pt-1">
                {attr.values.map((v) => {
                  const checked = active.values.includes(String(v.id));
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggle("attribute_values", String(v.id))}
                      title={v.value}
                      aria-label={v.value}
                      aria-pressed={checked}
                      className={cn(
                        "relative flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] ring-offset-2 ring-offset-[var(--color-surface-0)] transition-shadow",
                        checked ? "ring-2 ring-[var(--color-text-primary)]" : "hover:ring-1 hover:ring-[var(--color-border-dark)]"
                      )}
                      style={{ backgroundColor: v.code ?? undefined }}
                    >
                      {checked && (
                        <Check className="h-3.5 w-3.5 text-white mix-blend-difference" strokeWidth={3} />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <ShowMore
                items={attr.values}
                isActive={(v) => active.values.includes(String(v.id))}
                render={(v) => (
                  <Checkbox
                    key={v.id}
                    checked={active.values.includes(String(v.id))}
                    onChange={() => toggle("attribute_values", String(v.id))}
                    label={v.value}
                  />
                )}
              />
            )}
          </FilterSection>
        );
      })}
    </div>
  );
}

export function ProductFilters({ total, toolbarSlot, ...props }: ProductFiltersProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const filters = useFilterParams();
  const { activeCount, clearAll, isPending } = filters;
  const t = useT();

  const clearButton = activeCount > 0 && (
    <button
      type="button"
      onClick={clearAll}
      className="text-xs font-medium text-[var(--color-text-secondary)] underline underline-offset-4 transition-colors hover:text-[var(--color-text-primary)]"
    >
      {t("clear_all", "Clear all")}
    </button>
  );

  return (
    <>
      {/* Mobile: toolbar with filter trigger + sort */}
      <div className="lg:hidden flex items-center justify-between gap-3 border-y border-[var(--color-border)] py-3">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 text-sm font-medium"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("filters", "Filters")}
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-text-primary)] px-1.5 text-[11px] font-medium text-[var(--color-surface-0)]">
              {activeCount}
            </span>
          )}
        </button>
        {toolbarSlot}
      </div>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={t("filters", "Filters")}
        side="left"
      >
        <div className="flex min-h-full flex-col">
          <div className="flex-1 px-5 pb-4">
            <FilterContent {...props} filters={filters} />
          </div>
          <div className="sticky bottom-0 flex items-center gap-3 border-t border-[var(--color-border)] bg-white px-5 py-4">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="h-11 rounded-lg border border-[var(--color-border-dark)] px-4 text-sm font-medium"
              >
                {t("clear_all", "Clear all")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-neutral-900 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {isPending ? (
                <Spinner size="sm" />
              ) : (
                <>
                  {t("show_results", "Show results")}{" "}
                  <span className="tabular-nums opacity-70">({total})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Drawer>

      {/* Desktop: sticky sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 -mt-1">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            {t("filters", "Filters")}
            {isPending && <Spinner size="sm" />}
          </h2>
          {clearButton}
        </div>
        <FilterContent {...props} filters={filters} />
      </aside>
    </>
  );
}
