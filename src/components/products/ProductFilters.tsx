"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, ChevronLeft, Filter, Search, X } from "lucide-react";
import { ActiveFilters } from "./ActiveFilters";
import { Drawer } from "@/components/ui/Drawer";
import { Checkbox } from "@/components/ui/Checkbox";
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
}

/** Lists longer than this collapse behind a "Show more" toggle. */
const COLLAPSED_LIMIT = 6;

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

  // Single-select category navigation; null returns to all categories.
  const setCategory = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    if (slug) params.set("category", slug);
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

  return { active, activeCount, toggle, setCategory, setPrice, clearAll, isPending };
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

/** Ancestor chain (root → node) for a category slug, or [] if not found. */
function categoryPath(cats: Category[], slug: string): Category[] {
  for (const c of cats) {
    if (c.slug === slug) return [c];
    const sub = c.children?.length ? categoryPath(c.children, slug) : [];
    if (sub.length) return [c, ...sub];
  }
  return [];
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="pt-6">
      <div className="flex min-h-10 items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
        {action}
      </div>
      <div className="pt-3">{children}</div>
    </section>
  );
}

function CategoryNav({
  categories,
  filters,
}: {
  categories: Category[];
  filters: ReturnType<typeof useFilterParams>;
}) {
  const t = useT();
  const { active, setCategory } = filters;
  const path = active.categories.length === 1 ? categoryPath(categories, active.categories[0]) : [];
  const current = path[path.length - 1];
  // Drill into the current category's children; a leaf shows its siblings instead.
  const list = !current
    ? categories
    : current.children?.length
    ? current.children
    : path.length > 1
    ? path[path.length - 2].children
    : [];
  const trail = current && !current.children?.length ? path.slice(0, -1) : path;
  const indent = (depth: number) => ({ paddingLeft: `${depth}rem` });

  return (
    <div className="space-y-1.5 text-sm">
      {path.length > 0 && (
        <button
          type="button"
          onClick={() => setCategory(null)}
          className="flex items-center gap-1 text-slate-700 hover:text-brand-ink"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {t("all_categories", "All Categories")}
        </button>
      )}
      {trail.map((cat, i) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => setCategory(cat.slug)}
          style={indent(i + 1)}
          className={cn(
            "flex items-center gap-1 hover:text-brand-ink",
            cat === current ? "text-brand-ink" : "text-slate-700"
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {cat.name}
        </button>
      ))}
      {list.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => setCategory(cat.slug)}
          style={indent(path.length ? trail.length + 1.5 : 0)}
          className={cn(
            "block text-left hover:text-brand-ink",
            cat === current ? "font-medium text-brand-ink" : "text-slate-800"
          )}
        >
          {cat.name}
        </button>
      ))}
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
}: Omit<ProductFiltersProps, "total"> & {
  filters: ReturnType<typeof useFilterParams>;
}) {
  const t = useT();
  const [brandSearchOpen, setBrandSearchOpen] = useState(false);
  const [brandQuery, setBrandQuery] = useState("");
  const { active, toggle, setPrice } = filters;

  const filteredBrands = brandQuery
    ? brands.filter((b) => b.name.toLowerCase().includes(brandQuery.toLowerCase()))
    : brands;

  return (
    <div>
      {categories.length > 0 && (
        <Section title={t("shop_by_category", "Shop by Category")}>
          <CategoryNav categories={categories} filters={filters} />
        </Section>
      )}

      {brands.length > 0 && (
        <Section
          title={t("brands", "Brands")}
          action={
            <button
              type="button"
              onClick={() => {
                setBrandSearchOpen((o) => !o);
                setBrandQuery("");
              }}
              aria-label={t("search_brands", "Search brands")}
              aria-expanded={brandSearchOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-800 transition-colors hover:border-brand-500 hover:text-brand-ink"
            >
              {brandSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </button>
          }
        >
          {brandSearchOpen && (
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                autoFocus
                value={brandQuery}
                onChange={(e) => setBrandQuery(e.target.value)}
                placeholder={t("search_brands", "Search brands")}
                aria-label={t("search_brands", "Search brands")}
                className="w-full rounded-md border border-slate-200 bg-transparent py-1.5 pl-8 pr-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500"
              />
            </div>
          )}
          {filteredBrands.length === 0 ? (
            <p className="py-1.5 text-sm text-slate-500">{t("no_matches", "No matches")}</p>
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
        </Section>
      )}

      {priceRange.max > priceRange.min && (
        <Section title={t("price", "Price")}>
          <RangeSlider
            min={priceRange.min}
            max={priceRange.max}
            valueMin={active.priceMin ? Number(active.priceMin) : undefined}
            valueMax={active.priceMax ? Number(active.priceMax) : undefined}
            currency={currency}
            onCommit={setPrice}
          />
        </Section>
      )}

      {filterAttributes.map((attr) => {
        const isColor = attr.code === "color" && attr.values.some((v) => v.code);

        return (
          <Section key={attr.id} title={attr.name}>
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
                        checked ? "ring-2 ring-brand-500" : "hover:ring-1 hover:ring-[var(--color-border-dark)]"
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
          </Section>
        );
      })}
    </div>
  );
}

export function ProductFilters({ total, ...props }: ProductFiltersProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const filters = useFilterParams();
  const { activeCount, clearAll, isPending } = filters;
  const t = useT();

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="flex h-[52px] w-full shrink-0 items-center gap-2.5 rounded-lg bg-slate-50 px-4 text-sm text-slate-800 transition-colors hover:bg-slate-100 sm:w-60 lg:w-[210px]"
      >
        <Filter className="h-4 w-4" />
        {t("filter", "Filter")}
        {activeCount > 0 && (
          <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-medium text-[var(--color-primary-text)]">
            {activeCount}
          </span>
        )}
      </button>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={t("filter", "Filter")}
        side="left"
        className="max-w-[400px]"
      >
        <div className="flex min-h-full flex-col">
          <div className="flex-1 px-8 pb-6">
            <ActiveFilters
              categories={props.categories}
              brands={props.brands}
              filterAttributes={props.filterAttributes}
              currency={props.currency}
            />
            <FilterContent {...props} filters={filters} />
          </div>
          <div className="sticky bottom-0 flex items-center gap-3 border-t border-slate-200 bg-white px-8 py-4">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="h-11 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:border-brand-500 hover:text-brand-ink"
              >
                {t("clear_all", "Clear all")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-brand-500 text-sm font-medium text-[var(--color-primary-text)] transition-colors hover:bg-brand-600"
            >
              {isPending ? (
                <Spinner size="sm" />
              ) : (
                <>
                  {t("show_results", "Show results")}{" "}
                  <span className="tabular-nums opacity-80">({total})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
