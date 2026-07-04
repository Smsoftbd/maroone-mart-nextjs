"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FilterSection } from "@/components/ui/FilterSection";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { useT } from "@/lib/i18n/I18nProvider";
import type { Category, Brand, FilterAttribute } from "@/lib/api/types";

interface ProductFiltersProps {
  categories: Category[];
  brands: Brand[];
  filterAttributes: FilterAttribute[];
  priceRange: { min: number; max: number };
  currency: string;
}

function FilterContent({
  categories,
  brands,
  filterAttributes,
  priceRange,
  currency,
  onApply,
}: ProductFiltersProps & { onApply?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();

  const activeCategories = searchParams.getAll("category");
  const activeBrands = searchParams.getAll("brands");
  const activeValues = searchParams.getAll("attribute_values");
  const priceMin = searchParams.get("price_min");
  const priceMax = searchParams.get("price_max");

  const push = (params: URLSearchParams) => {
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
    onApply?.();
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
    push(params);
  };

  const setPrice = (min: number | undefined, max: number | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (min != null) params.set("price_min", String(min));
    else params.delete("price_min");
    if (max != null) params.set("price_max", String(max));
    else params.delete("price_max");
    push(params);
  };

  const clearAll = () => {
    router.push("/products");
    onApply?.();
  };

  const activeCount =
    activeCategories.length +
    activeBrands.length +
    activeValues.length +
    (priceMin || priceMax ? 1 : 0);

  const renderCategory = (cat: Category, depth: number): React.ReactNode => (
    <div key={cat.id} style={{ paddingLeft: depth ? `${depth * 0.75}rem` : undefined }}>
      <Checkbox
        checked={activeCategories.includes(cat.slug)}
        onChange={() => toggle("category", cat.slug)}
        label={cat.name}
      />
      {cat.children?.length
        ? cat.children.map((child) => renderCategory(child, depth + 1))
        : null}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold">{t("filters", "Filters")}</h2>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> {t("clear_all", "Clear all")}
          </button>
        )}
      </div>

      <FilterSection title={t("categories", "Categories")} activeCount={activeCategories.length}>
        <div>{categories.map((cat) => renderCategory(cat, 0))}</div>
      </FilterSection>

      {priceRange.max > priceRange.min && (
        <FilterSection title={t("price", "Price")} activeCount={priceMin || priceMax ? 1 : 0}>
          <RangeSlider
            min={priceRange.min}
            max={priceRange.max}
            valueMin={priceMin ? Number(priceMin) : undefined}
            valueMax={priceMax ? Number(priceMax) : undefined}
            currency={currency}
            onCommit={setPrice}
          />
        </FilterSection>
      )}

      {brands.length > 0 && (
        <FilterSection title={t("brands", "Brands")} activeCount={activeBrands.length}>
          <div>
            {brands.map((brand) => (
              <Checkbox
                key={brand.id}
                checked={activeBrands.includes(String(brand.id))}
                onChange={() => toggle("brands", String(brand.id))}
                label={brand.name}
              />
            ))}
          </div>
        </FilterSection>
      )}

      {filterAttributes.map((attr) => (
        <FilterSection
          key={attr.id}
          title={attr.name}
          activeCount={attr.values.filter((v) => activeValues.includes(String(v.id))).length}
        >
          <div>
            {attr.values.map((v) => (
              <Checkbox
                key={v.id}
                checked={activeValues.includes(String(v.id))}
                onChange={() => toggle("attribute_values", String(v.id))}
                label={v.value}
                swatch={attr.code === "color" ? v.code : undefined}
              />
            ))}
          </div>
        </FilterSection>
      ))}
    </div>
  );
}

export function ProductFilters(props: ProductFiltersProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const t = useT();

  return (
    <>
      {/* Mobile: filter button */}
      <div className="lg:hidden">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("filters", "Filters")}
        </Button>
        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={t("filters", "Filters")}
          side="left"
        >
          <div className="p-5">
            <FilterContent {...props} onApply={() => setDrawerOpen(false)} />
          </div>
        </Drawer>
      </div>

      {/* Desktop: sticky sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
        <FilterContent {...props} />
      </aside>
    </>
  );
}
