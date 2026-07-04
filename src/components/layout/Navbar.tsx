"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  Search,
  Heart,
  ShoppingBag,
  User,
  LogOut,
  Package,
  Phone,
  ChevronDown,
} from "lucide-react";
import { useCartStore } from "@/lib/stores/cartStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUiStore } from "@/lib/stores/uiStore";
import { cn } from "@/lib/utils/cn";
import { SearchBox } from "./SearchBox";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useT } from "@/lib/i18n/I18nProvider";
import type { Category, Store } from "@/lib/api/types";

interface NavbarProps {
  store: Store;
  categories: Category[];
}

export function Navbar({ store, categories }: NavbarProps) {
  const t = useT();
  const [scrolled, setScrolled] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems);
  const openCart = useCartStore((s) => s.openCart);
  const { customer, isAuthenticated, logout } = useAuthStore();
  const { isSearchOpen, toggleSearch, closeSearch, toggleMobileNav } = useUiStore();
  const [accountOpen, setAccountOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navCategories = categories.slice(0, 8);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-brand-500 text-[var(--color-primary-text)] transition-shadow duration-300",
        scrolled ? "shadow-md" : "shadow-sm md:shadow-none"
      )}
    >
      {/* ── Top row ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-x-3 py-2 lg:py-2.5">
          {/* Mobile: hamburger */}
          <button
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-white/15 transition-colors"
            onClick={toggleMobileNav}
            aria-label={t("open_menu", "Open menu")}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            {store.logo ? (
              <Image
                src={store.logo}
                alt={store.name}
                width={200}
                height={68}
                className="h-9 lg:h-14 w-auto max-w-[140px] lg:max-w-[220px] object-contain"
                priority
              />
            ) : (
              <span className="font-display text-xl lg:text-2xl font-bold">
                {store.name}
              </span>
            )}
          </Link>

          {/* Desktop: search + call us */}
          <div className="hidden lg:flex items-center gap-8 flex-1 justify-end">
            <SearchBox
              categories={categories}
              currency={store.currency_symbol}
              className="max-w-sm"
            />

            {store.phone && (
              <a
                href={`tel:${store.phone.replace(/\s+/g, "")}`}
                className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
              >
                <Phone className="h-6 w-6" />
                <div className="text-xs capitalize leading-tight">
                  <p>{t("call_us_now", "Call us now")}</p>
                  <p className="font-semibold">{store.phone}</p>
                </div>
              </a>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 lg:gap-3">
            {/* Mobile: search toggle */}
            <button
              className="lg:hidden p-2 rounded-full hover:bg-white/15 transition-colors"
              onClick={toggleSearch}
              aria-label={t("search", "Search")}
            >
              <Search className="h-6 w-6" />
            </button>

            {store.features.wishlist && (
              <Link
                href="/account/wishlist"
                className="hidden lg:flex p-2 rounded-full hover:bg-white/15 transition-colors"
                aria-label={t("wishlist", "Wishlist")}
              >
                <Heart className="h-6 w-6" />
              </Link>
            )}

            {/* Account dropdown */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className="p-2 rounded-full hover:bg-white/15 transition-colors"
                aria-label={t("account", "Account")}
              >
                <User className="h-6 w-6" />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white text-gray-900 border border-[var(--color-border)] rounded-xl shadow-lg py-2 z-50">
                  {isAuthenticated ? (
                    <>
                      <p className="px-4 py-2 text-xs font-medium text-[var(--color-text-muted)] truncate">
                        {customer?.name}
                      </p>
                      <Link
                        href="/account"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-surface-100"
                        onClick={() => setAccountOpen(false)}
                      >
                        <User className="h-4 w-4" /> Dashboard
                      </Link>
                      <Link
                        href="/account/orders"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-surface-100"
                        onClick={() => setAccountOpen(false)}
                      >
                        <Package className="h-4 w-4" /> Orders
                      </Link>
                      <button
                        onClick={() => { logout(); setAccountOpen(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-surface-100 text-red-600"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block px-4 py-2 text-sm hover:bg-surface-100"
                        onClick={() => setAccountOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        className="block px-4 py-2 text-sm hover:bg-surface-100"
                        onClick={() => setAccountOpen(false)}
                      >
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative p-2 rounded-full hover:bg-white/15 transition-colors"
              aria-label={`Cart, ${totalItems} items`}
            >
              <ShoppingBag className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-white text-brand-500 text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center font-bold">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>

            {/* Language switcher */}
            <LanguageSwitcher languages={store.languages} />
          </div>
        </div>

        {/* Mobile: collapsible search */}
        {isSearchOpen && (
          <div className="lg:hidden pb-2.5">
            <SearchBox
              categories={categories}
              currency={store.currency_symbol}
              autoFocus
              onNavigate={closeSearch}
            />
          </div>
        )}
      </div>

      {/* ── Category bar + megamenu (desktop) ────────────────── */}
      {navCategories.length > 0 && (
        <div
          className="hidden lg:block relative"
          onMouseLeave={() => setActiveCat(null)}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border-t border-[var(--color-primary-text)]/10" />
            <div className="flex items-center gap-5 py-3 text-sm font-semibold overflow-hidden whitespace-nowrap">
              {navCategories.map((cat) => {
                const hasChildren = (cat.children?.length ?? 0) > 0;
                return (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.slug}`}
                    title={cat.name}
                    onMouseEnter={() => setActiveCat(hasChildren ? cat.id : null)}
                    className={cn(
                      "shrink-0 uppercase flex items-center gap-1.5 transition-opacity",
                      activeCat === cat.id ? "opacity-100" : "opacity-90 hover:opacity-100"
                    )}
                  >
                    {cat.name}
                    {hasChildren && (
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform",
                          activeCat === cat.id && "rotate-180"
                        )}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Megamenu panel */}
          {navCategories.map((cat) => {
            if (activeCat !== cat.id || !(cat.children?.length ?? 0)) return null;
            return (
              <div
                key={cat.id}
                className="absolute left-0 right-0 top-full bg-brand-500 text-[var(--color-primary-text)] shadow-lg border-t border-[var(--color-primary-text)]/10 animate-fade-up"
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {cat.children.map((child) => (
                      <div key={child.id} className="mb-2 min-w-0">
                        <div className="transform hover:translate-x-1 transition-transform ease-in-out duration-300">
                          <Link
                            href={`/products?category=${child.slug}`}
                            onClick={() => setActiveCat(null)}
                            className="block font-medium text-xs uppercase truncate"
                          >
                            {child.name}
                          </Link>
                        </div>
                        {child.children?.map((gc) => (
                          <div
                            key={gc.id}
                            className="transform hover:translate-x-1 transition-transform ease-in-out duration-300"
                          >
                            <Link
                              href={`/products?category=${gc.slug}`}
                              onClick={() => setActiveCat(null)}
                              className="block mt-2 font-light text-xs opacity-90 uppercase truncate"
                            >
                              {gc.name}
                            </Link>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-[var(--color-primary-text)]/10">
                    <Link
                      href={`/products?category=${cat.slug}`}
                      onClick={() => setActiveCat(null)}
                      className="inline-flex items-center gap-1 text-xs font-semibold uppercase opacity-90 hover:opacity-100 hover:gap-2 transition-all"
                    >
                      View all {cat.name}
                      <ChevronDown className="h-4 w-4 -rotate-90" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
}
