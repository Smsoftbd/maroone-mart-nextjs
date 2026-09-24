"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, ChevronLeft, Filter } from "lucide-react";
import { ActiveFilters } from "./ActiveFilters";
import { Drawer } from "@/components/ui/Drawer";
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

  // Free-text search inside the current listing ("Search in category…").
  const setSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const value = term.trim();
    if (value) params.set("search", value);
    else params.delete("search");
    navigate(params);
  };

  // Special offers: a single discount floor ("50" | "30" | "1"), cleared by
  // picking the same bucket again.
  const setDiscount = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("discount", value);
    else params.delete("discount");
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
    discount: searchParams.get("discount"),
    search: searchParams.get("search") ?? "",
  };
  const activeCount =
    active.categories.length +
    active.brands.length +
    active.values.length +
    (active.priceMin || active.priceMax ? 1 : 0) +
    (active.discount ? 1 : 0);

  return { active, activeCount, toggle, setCategory, setPrice, setSearch, setDiscount, clearAll, isPending };
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

function FilterCard({
  title,
  action,
  tone,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  /** "offers" paints the tinted Special Offers card. */
  tone?: "offers";
  children: React.ReactNode;
}) {
  return (
    <section className={cn("filter-card", tone === "offers" && "is-offers")}>
      <div className="filter-card-head">
        <h3 className="filter-card-title">
          <span>{title}</span>
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Price buckets, matching the reference sidebar. */
const PRICE_BUCKETS: { min?: number; max?: number }[] = [
  { max: 1000 },
  { min: 1000, max: 5000 },
  { min: 5000, max: 15000 },
  { min: 15000 },
];

/** Discount floors for the Special Offers card. */
const OFFER_BUCKETS = [
  { value: "50", label: "50% or more" },
  { value: "30", label: "30% - 50%" },
  { value: "1", label: "1% - 30%" },
];

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
    <div className="cat-nav">
      {path.length > 0 && (
        <button
          type="button"
          onClick={() => setCategory(null)}
          className="flex items-center gap-1"
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
          className={cn("flex items-center gap-1", cat === current && "is-active")}
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
          className={cn("block text-left", cat === current && "is-active")}
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
  currency,
  filters,
}: Omit<ProductFiltersProps, "total" | "priceRange"> & {
  filters: ReturnType<typeof useFilterParams>;
}) {
  const t = useT();
  const { active, toggle, setPrice, setDiscount } = filters;

  const money = (n: number) => `${currency === "৳" ? "Tk " : currency}${n.toLocaleString("en-US")}`;
  const priceLabel = (b: { min?: number; max?: number }) =>
    b.min == null
      ? `${t("under", "Under")} ${money(b.max!)}`
      : b.max == null
      ? `${t("above", "Above")} ${money(b.min)}`
      : `${money(b.min)} - ${money(b.max)}`;
  const priceChecked = (b: { min?: number; max?: number }) =>
    String(b.min ?? "") === (active.priceMin ?? "") && String(b.max ?? "") === (active.priceMax ?? "");

  return (
    <div>
      {categories.length > 0 && (
        <FilterCard title={t("shop_by_category", "Categories")}>
          <CategoryNav categories={categories} filters={filters} />
        </FilterCard>
      )}

      {brands.length > 0 && (
        <FilterCard
          title={t("brands", "Brands")}
          action={
            active.brands.length > 0 && (
              <button
                type="button"
                onClick={() => active.brands.forEach((id) => toggle("brands", id))}
                className="filter-card-action"
              >
                {t("clear", "Clear")}
              </button>
            )
          }
        >
          <ShowMore
            items={brands}
            isActive={(b) => active.brands.includes(String(b.id))}
            render={(brand) => (
              <label key={brand.id} className="filter-option">
                <input
                  type="checkbox"
                  checked={active.brands.includes(String(brand.id))}
                  onChange={() => toggle("brands", String(brand.id))}
                />
                <span className="truncate">{brand.name}</span>
                {brand.products_count != null && (
                  <span className="filter-count tabular-nums">({brand.products_count})</span>
                )}
              </label>
            )}
          />
        </FilterCard>
      )}

      <FilterCard
        title={t("price_range", "Price Range")}
        action={
          (active.priceMin || active.priceMax) && (
            <button type="button" onClick={() => setPrice(undefined, undefined)} className="filter-card-action">
              {t("reset", "Reset")}
            </button>
          )
        }
      >
        {PRICE_BUCKETS.map((b) => (
          <label key={`${b.min ?? 0}-${b.max ?? 0}`} className="filter-option">
            <input
              type="radio"
              name="price-bucket"
              checked={priceChecked(b)}
              onChange={() => setPrice(b.min, b.max)}
            />
            {priceLabel(b)}
          </label>
        ))}
      </FilterCard>

      <FilterCard
        title={t("special_offers", "Special Offers")}
        action={
          active.discount && (
            <button type="button" onClick={() => setDiscount(null)} className="filter-card-action">
              {t("clear", "Clear")}
            </button>
          )
        }
      >
        {OFFER_BUCKETS.map((o) => (
          <label key={o.value} className="filter-option">
            <input
              type="checkbox"
              checked={active.discount === o.value}
              onChange={() => setDiscount(active.discount === o.value ? null : o.value)}
            />
            {t(`offer_${o.value}`, o.label)}
          </label>
        ))}
      </FilterCard>

      {filterAttributes.map((attr) => {
        const isColor = attr.code === "color" && attr.values.some((v) => v.code);

        return (
          <FilterCard key={attr.id} title={attr.name}>
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
                  <label key={v.id} className="filter-option">
                    <input
                      type="checkbox"
                      checked={active.values.includes(String(v.id))}
                      onChange={() => toggle("attribute_values", String(v.id))}
                    />
                    <span className="truncate">{v.value}</span>
                  </label>
                )}
              />
            )}
          </FilterCard>
        );
      })}
    </div>
  );
}

/**
 * Inline filter column for layout.filter_position = left | right (desktop).
 * Phones, and the "drawer" setting, use the ProductFilters button instead.
 */
export function ProductFilterSidebar(props: Omit<ProductFiltersProps, "total">) {
  const filters = useFilterParams();
  return <FilterContent {...props} filters={filters} />;
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
        className="filters-button flex h-12 min-w-0 flex-1 shrink-0 items-center justify-center gap-2.5 rounded-lg bg-slate-200/70 px-4 text-[15px] text-slate-800 transition-colors hover:bg-slate-200 sm:h-[52px] sm:w-60 sm:flex-none sm:justify-start sm:bg-slate-50 sm:text-sm sm:hover:bg-slate-100 lg:w-[210px]"
      >
        <Filter className="h-5 w-5 sm:h-4 sm:w-4" strokeWidth={1.75} />
        <span className="sm:hidden">{t("filter_products", "Filter")}</span>
        <span className="hidden sm:inline">{t("filter", "Filter")}</span>
        {activeCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 sm:ml-auto px-1.5 text-xs font-medium text-[var(--color-primary-text)]">
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
          <div className="flex-1 px-4 pb-6 sm:px-8">
            <ActiveFilters
              categories={props.categories}
              brands={props.brands}
              filterAttributes={props.filterAttributes}
              currency={props.currency}
            />
            <FilterContent {...props} filters={filters} />
          </div>
          <div className="sticky bottom-0 flex items-center gap-3 border-t border-slate-200 bg-surface px-4 py-4 sm:px-8">
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
