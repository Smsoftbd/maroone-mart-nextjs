"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Search, ShoppingCart, User, ChevronDown, ChevronRight } from "lucide-react";
import { useCartStore } from "@/lib/stores/cartStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUiStore } from "@/lib/stores/uiStore";
import { cn } from "@/lib/utils/cn";
import { SearchBox } from "./SearchBox";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useT } from "@/lib/i18n/I18nProvider";
import type { Category, Store } from "@/lib/api/types";

interface HomeNavbarProps {
  store: Store;
  categories: Category[];
  scrolled: boolean;
}

const circleBtn =
  "relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition-colors hover:border-brand-500 hover:text-brand-500";

/** Single-row white header used on the homepage. */
export function HomeNavbar({ store, categories, scrolled }: HomeNavbarProps) {
  const t = useT();
  const totalItems = useCartStore((s) => s.totalItems);
  const openCart = useCartStore((s) => s.openCart);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isSearchOpen, toggleSearch, closeSearch, toggleMobileNav } = useUiStore();
  const [catOpen, setCatOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<number | null>(null);

  const navCategories = categories.slice(0, 14);
  const active = navCategories.find((c) => c.id === activeCat);

  const navLink = "text-sm text-slate-700 transition-colors hover:text-brand-500";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-slate-200 bg-white text-slate-900 transition-shadow duration-300",
        scrolled && "shadow-md"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-3 lg:h-20 lg:gap-6">
          <button
            className="lg:hidden -ml-2 rounded-lg p-2 hover:bg-slate-100"
            onClick={toggleMobileNav}
            aria-label={t("open_menu", "Open menu")}
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link href="/" className="flex shrink-0 items-center">
            {store.logo ? (
              <Image
                src={store.logo}
                alt={store.name}
                width={200}
                height={60}
                className="h-9 w-auto max-w-[140px] object-contain lg:h-11 lg:max-w-[180px]"
                priority
              />
            ) : (
              <span className="text-xl font-bold text-brand-500 lg:text-2xl">{store.name}</span>
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 lg:flex">
            {navCategories.length > 0 && (
              <div
                className="relative"
                onMouseEnter={() => setCatOpen(true)}
                onMouseLeave={() => {
                  setCatOpen(false);
                  setActiveCat(null);
                }}
              >
                <button
                  type="button"
                  onClick={() => setCatOpen((o) => !o)}
                  aria-expanded={catOpen}
                  className={cn(navLink, "flex items-center gap-1 py-6")}
                >
                  {t("categories", "Categories")}
                  <ChevronDown className={cn("h-4 w-4 transition-transform", catOpen && "rotate-180")} />
                </button>

                {catOpen && (
                  <div className="absolute left-0 top-full z-50 flex animate-fade-up overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <ul className="w-60 py-2">
                      {navCategories.map((cat) => {
                        const hasChildren = (cat.children?.length ?? 0) > 0;
                        return (
                          <li key={cat.id} onMouseEnter={() => setActiveCat(hasChildren ? cat.id : null)}>
                            <Link
                              href={`/products?category=${cat.slug}`}
                              onClick={() => setCatOpen(false)}
                              className={cn(
                                "flex items-center justify-between gap-2 px-4 py-2 text-sm transition-colors hover:bg-brand-50 hover:text-brand-500",
                                activeCat === cat.id && "bg-brand-50 text-brand-500"
                              )}
                            >
                              <span className="truncate">{cat.name}</span>
                              {hasChildren && <ChevronRight className="h-4 w-4 shrink-0" />}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>

                    {active && (
                      <div className="grid w-[420px] grid-cols-2 content-start gap-x-6 gap-y-4 border-l border-slate-100 p-5">
                        {active.children.map((child) => (
                          <div key={child.id} className="min-w-0">
                            <Link
                              href={`/products?category=${child.slug}`}
                              onClick={() => setCatOpen(false)}
                              className="block truncate text-sm font-medium text-slate-900 hover:text-brand-500"
                            >
                              {child.name}
                            </Link>
                            {child.children?.map((gc) => (
                              <Link
                                key={gc.id}
                                href={`/products?category=${gc.slug}`}
                                onClick={() => setCatOpen(false)}
                                className="mt-1.5 block truncate text-xs text-slate-500 hover:text-brand-500"
                              >
                                {gc.name}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <Link href="/flash-sale" className={navLink}>
              {t("flash_sale", "Flash Sale")}
            </Link>
            <Link href="/products" className={navLink}>
              {t("all_products", "All Products")}
            </Link>
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2 lg:gap-4">
            <SearchBox
              categories={categories}
              currency={store.currency_symbol}
              className="hidden max-w-sm lg:block"
              variant="minimal"
            />

            <button
              className="rounded-full p-2 hover:bg-slate-100 lg:hidden"
              onClick={toggleSearch}
              aria-label={t("search", "Search")}
            >
              <Search className="h-6 w-6" />
            </button>

            {store.auth_mode !== "guest_only" && (
              <Link
                href={isAuthenticated ? "/account" : "/login"}
                className={cn(circleBtn, "hidden lg:flex")}
                aria-label={t("account", "Account")}
              >
                <User className="h-5 w-5" />
              </Link>
            )}

            <button
              onClick={openCart}
              className={cn(circleBtn, "h-10 w-10 lg:h-11 lg:w-11")}
              aria-label={`Cart, ${totalItems} items`}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>

            <LanguageSwitcher
              languages={store.languages}
              buttonClassName="h-11 gap-1.5 border border-slate-200 px-3 text-slate-700 hover:bg-slate-50"
            />
          </div>
        </div>

        {isSearchOpen && (
          <div className="pb-3 lg:hidden">
            <SearchBox
              categories={categories}
              currency={store.currency_symbol}
              autoFocus
              onNavigate={closeSearch}
              variant="minimal"
            />
          </div>
        )}
      </div>
    </header>
  );
}
