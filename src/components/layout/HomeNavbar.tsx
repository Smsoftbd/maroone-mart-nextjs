"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Search, ShoppingBag, ShoppingBasket, ShoppingCart, User, ChevronDown, ChevronRight } from "lucide-react";
import { useCartStore } from "@/lib/stores/cartStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUiStore } from "@/lib/stores/uiStore";
import { cn } from "@/lib/utils/cn";
import { SearchBox } from "./SearchBox";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ColorSchemeToggle } from "./ColorSchemeToggle";
import { useT } from "@/lib/i18n/I18nProvider";
import type { Category, Store } from "@/lib/api/types";

interface HomeNavbarProps {
  store: Store;
  categories: Category[];
  scrolled: boolean;
}

const circleBtn = "header-icon-btn relative flex h-11 w-11 items-center justify-center rounded-full lg:h-12 lg:w-12";
const CART_ICONS = { bag: ShoppingBag, cart: ShoppingCart, basket: ShoppingBasket };
const iconBtn = "rounded-full p-2 text-[var(--color-header-icon,currentColor)] hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]";

/**
 * Site header, driven by the Appearance layout:
 * - classic:  logo, nav, search bar, icons
 * - centered: nav left, logo centered, search behind an icon
 * - minimal:  logo, nav, icons; no search bar on desktop
 * `sticky_header` pins it while scrolling; height, logo size, menu alignment,
 * bottom edge and the glass effect come from the theme (see globals.css).
 */
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

  const layout = store.theme.layout;
  const CartIcon = CART_ICONS[layout.cart_icon];
  const bottomNav = layout.mobile_nav === "bottom";
  const style = layout.header_style;
  const centered = style === "centered";
  const navLink = "header-nav-link text-sm";

  const logo = (
    <Link href="/" className={cn("flex shrink-0 items-center", centered && "justify-self-center")}>
      {store.logo ? (
        <Image
          src={store.logo}
          alt={store.name}
          width={200}
          height={60}
          className="site-logo w-auto max-w-[140px] object-contain lg:max-w-[180px]"
          priority
        />
      ) : (
        <span className="font-display text-xl font-bold lg:text-2xl">{store.name}</span>
      )}
    </Link>
  );

  return (
    <header
      className={cn(
        "site-header z-40",
        layout.sticky_header ? "sticky top-0" : "relative",
        scrolled && "is-scrolled"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "header-row items-center gap-3 lg:gap-6",
            centered ? "grid grid-cols-[1fr_auto_1fr]" : "flex"
          )}
        >
          <div className={cn("flex items-center gap-6", !centered && "contents")}>
          {/* Phones use the bottom tab bar; the drawer menu is a tablet affordance. */}
          <button
            className={cn("hidden md:block lg:hidden -ml-2", iconBtn, bottomNav && "md:hidden")}
            onClick={toggleMobileNav}
            aria-label={t("open_menu", "Open menu")}
          >
            <Menu className="h-6 w-6" />
          </button>

          {!centered && logo}

          {/* Desktop nav */}
          <nav className="header-nav hidden items-center gap-6 lg:flex">
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
                  <div className="header-menu absolute left-0 top-full z-50 flex animate-fade-up overflow-hidden rounded-xl border border-[var(--color-border)] shadow-xl">
                    <ul className="w-60 py-2">
                      {navCategories.map((cat) => {
                        const hasChildren = (cat.children?.length ?? 0) > 0;
                        return (
                          <li key={cat.id} onMouseEnter={() => setActiveCat(hasChildren ? cat.id : null)}>
                            <Link
                              href={`/products?category=${cat.slug}`}
                              onClick={() => setCatOpen(false)}
                              className={cn(
                                "flex items-center justify-between gap-2 px-4 py-2 text-sm transition-colors hover:bg-brand-50 hover:text-brand-ink",
                                activeCat === cat.id && "bg-brand-50 text-brand-ink"
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
                      <div className="grid w-[420px] grid-cols-2 content-start gap-x-6 gap-y-4 border-l border-[var(--color-border)] p-5">
                        {active.children.map((child) => (
                          <div key={child.id} className="min-w-0">
                            <Link
                              href={`/products?category=${child.slug}`}
                              onClick={() => setCatOpen(false)}
                              className="block truncate text-sm font-medium hover:text-brand-ink"
                            >
                              {child.name}
                            </Link>
                            {child.children?.map((gc) => (
                              <Link
                                key={gc.id}
                                href={`/products?category=${gc.slug}`}
                                onClick={() => setCatOpen(false)}
                                className="mt-1.5 block truncate text-xs opacity-70 hover:text-brand-ink hover:opacity-100"
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
          </div>

          {centered && logo}

          <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2 lg:gap-4">
            {style === "classic" && (
              <SearchBox
                categories={categories}
                currency={store.currency_symbol}
                className="hidden w-full max-w-sm lg:mr-2 lg:block lg:max-w-[352px]"
                variant="minimal"
              />
            )}

            <button
              className={cn(iconBtn, !centered && "lg:hidden")}
              onClick={toggleSearch}
              aria-label={t("search", "Search")}
              aria-expanded={isSearchOpen}
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
              className={cn(circleBtn, "cart-icon-btn h-10 w-10 max-md:border-transparent lg:h-12 lg:w-12")}
              aria-label={`Cart, ${totalItems} items`}
            >
              <CartIcon className="h-5 w-5 max-md:h-6 max-md:w-6" strokeWidth={1.75} />
              {totalItems > 0 && (
                <span className="cart-badge absolute -right-1 -top-1.5 flex h-5 min-w-5 max-md:-right-2 max-md:-top-2.5 max-md:h-6 max-md:min-w-6 max-md:text-sm items-center justify-center rounded-full px-1 text-[11px] font-semibold">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>

            <ColorSchemeToggle className={cn(iconBtn, "hidden sm:flex")} />

            <LanguageSwitcher
              languages={store.languages}
              buttonClassName="header-icon-btn h-11 gap-1.5 px-3 lg:h-12 max-md:w-12 max-md:h-12 max-md:!rounded-full max-md:!px-0 max-md:justify-center"
            />
          </div>
        </div>

        {isSearchOpen && (
          <div className={cn("pb-3", centered ? "lg:mx-auto lg:max-w-xl" : "lg:hidden")}>
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
