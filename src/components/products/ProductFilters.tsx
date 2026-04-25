"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import type { Category, Brand } from "@/lib/api/types";

interface ProductFiltersProps {
  categories: Category[];
  brands: Brand[];
  activeCategory?: string;
  activeBrand?: string;
}

function FilterContent({
  categories,
  brands,
  activeCategory,
  activeBrand,
  onApply,
}: ProductFiltersProps & { onApply?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/products?${params.toString()}`);
    onApply?.();
  };

  const clearAll = () => {
    router.push("/products");
    onApply?.();
  };

  const hasFilters = activeCategory || activeBrand;

  return (
    <div className="space-y-6">
      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 text-sm text-brand-500 hover:text-brand-600 transition-colors"
        >
          <X className="h-3.5 w-3.5" /> Clear all filters
        </button>
      )}

      <div>
        <h3 className="font-display font-semibold mb-3 text-sm uppercase tracking-wide">
          Categories
        </h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => setFilter("category", undefined)}
              className={cn(
                "w-full text-left text-sm py-1.5 px-2 rounded-lg transition-colors",
                !activeCategory
                  ? "bg-brand-50 text-brand-600 font-medium"
                  : "text-[var(--color-text-secondary)] hover:bg-surface-100"
              )}
            >
              All Categories
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => setFilter("category", cat.slug)}
                className={cn(
                  "w-full text-left text-sm py-1.5 px-2 rounded-lg transition-colors",
                  activeCategory === cat.slug
                    ? "bg-brand-50 text-brand-600 font-medium"
                    : "text-[var(--color-text-secondary)] hover:bg-surface-100"
                )}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {brands.length > 0 && (
        <div>
          <h3 className="font-display font-semibold mb-3 text-sm uppercase tracking-wide">
            Brands
          </h3>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setFilter("brand", undefined)}
                className={cn(
                  "w-full text-left text-sm py-1.5 px-2 rounded-lg transition-colors",
                  !activeBrand
                    ? "bg-brand-50 text-brand-600 font-medium"
                    : "text-[var(--color-text-secondary)] hover:bg-surface-100"
                )}
              >
                All Brands
              </button>
            </li>
            {brands.map((brand) => (
              <li key={brand.id}>
                <button
                  onClick={() => setFilter("brand", brand.name)}
                  className={cn(
                    "w-full text-left text-sm py-1.5 px-2 rounded-lg transition-colors",
                    activeBrand === brand.name
                      ? "bg-brand-50 text-brand-600 font-medium"
                      : "text-[var(--color-text-secondary)] hover:bg-surface-100"
                  )}
                >
                  {brand.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ProductFilters(props: ProductFiltersProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          Filters
        </Button>
        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Filters"
          side="left"
        >
          <div className="p-5">
            <FilterContent {...props} onApply={() => setDrawerOpen(false)} />
          </div>
        </Drawer>
      </div>

      {/* Desktop: sticky sidebar */}
      <aside className="hidden lg:block w-52 shrink-0 sticky top-24 self-start">
        <FilterContent {...props} />
      </aside>
    </>
  );
}
