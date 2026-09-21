"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
  // The homepage runs a minimal, editorial header; every other route keeps the
  // solid brand bar.
  const isHome = usePathname() === "/";
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

  // Minimal (home) vs brand (everywhere else) tokens.
  const iconHover = isHome ? "hover:bg-neutral-900/[0.06]" : "hover:bg-white/15";
  const iconStroke = isHome ? 1.5 : 2;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-shadow duration-300",
        isHome
          ? "bg-white/85 text-neutral-900 backdrop-blur-md border-b border-neutral-200"
          : "bg-brand-500 text-[var(--color-primary-text)]",
        isHome
          ? scrolled
            ? "shadow-[0_1px_24px_-12px_rgba(0,0,0,0.35)]"
            : "shadow-none"
          : scrolled
            ? "shadow-md"
            : "shadow-sm md:shadow-none"
      )}
    >
      {/* ── Top row ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "flex items-center justify-between gap-x-3",
            isHome ? "py-3 lg:py-4" : "py-2 lg:py-2.5"
          )}
        >
          {/* Mobile: hamburger */}
          <button
            className={cn("lg:hidden p-2 -ml-2 rounded-lg transition-colors", iconHover)}
            onClick={toggleMobileNav}
            aria-label={t("open_menu", "Open menu")}
          >
            <Menu className="h-6 w-6" strokeWidth={iconStroke} />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            {store.logo ? (
              <Image
                src={store.logo}
                alt={store.name}
                width={200}
                height={68}
                className={cn(
                  "w-auto object-contain",
                  isHome
                    ? "h-8 lg:h-11 max-w-[130px] lg:max-w-[190px]"
                    : "h-9 lg:h-14 max-w-[140px] lg:max-w-[220px]"
                )}
                priority
              />
            ) : (
              <span
                className={cn(
                  "font-display",
                  isHome
                    ? "text-lg lg:text-xl font-normal uppercase tracking-[0.28em]"
                    : "text-xl lg:text-2xl font-bold"
                )}
              >
                {store.name}
              </span>
            )}
          </Link>

          {/* Desktop: search + call us */}
          <div
            className={cn(
              "hidden lg:flex items-center flex-1 justify-end",
              isHome ? "gap-10" : "gap-8"
            )}
          >
            <SearchBox
              categories={categories}
              currency={store.currency_symbol}
              className="max-w-sm"
              variant={isHome ? "minimal" : "default"}
            />

            {store.phone && (
              <a
                href={`tel:${store.phone.replace(/\s+/g, "")}`}
                className="flex items-center gap-2 shrink-0 hover:opacity-60 transition-opacity"
              >
                <Phone className={isHome ? "h-5 w-5" : "h-6 w-6"} strokeWidth={iconStroke} />
                <div
                  className={cn(
                    "leading-tight",
                    isHome
                      ? "text-[10px] uppercase tracking-[0.14em]"
                      : "text-xs capitalize"
                  )}
                >
                  <p className={isHome ? "text-neutral-500" : undefined}>
                    {t("call_us_now", "Call us now")}
                  </p>
                  <p className="font-semibold">{store.phone}</p>
                </div>
              </a>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 lg:gap-3">
            {/* Mobile: search toggle */}
            <button
              className={cn("lg:hidden p-2 rounded-full transition-colors", iconHover)}
              onClick={toggleSearch}
              aria-label={t("search", "Search")}
            >
              <Search className="h-6 w-6" strokeWidth={iconStroke} />
            </button>

            {store.features.wishlist && (
              <Link
                href="/account/wishlist"
                className={cn(
                  "hidden lg:flex p-2 rounded-full transition-colors",
                  iconHover
                )}
                aria-label={t("wishlist", "Wishlist")}
              >
                <Heart className="h-6 w-6" strokeWidth={iconStroke} />
              </Link>
            )}

            {/* Account dropdown — hidden entirely in guest-only stores */}
            {store.auth_mode !== "guest_only" && (
            <div className="relative hidden lg:block">
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className={cn("p-2 rounded-full transition-colors", iconHover)}
                aria-label={t("account", "Account")}
              >
                <User className="h-6 w-6" strokeWidth={iconStroke} />
              </button>
              {accountOpen && (
                <div
                  className={cn(
                    "absolute right-0 top-full mt-2 w-48 bg-white text-gray-900 py-2 z-50",
                    isHome
                      ? "border border-neutral-200 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.5)]"
                      : "border border-[var(--color-border)] rounded-xl shadow-lg"
                  )}
                >
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
                        {store.auth_mode === "sms_otp" ? "Login / Sign Up" : "Login"}
                      </Link>
                      {store.auth_mode === "email_password" && (
                        <Link
                          href="/register"
                          className="block px-4 py-2 text-sm hover:bg-surface-100"
                          onClick={() => setAccountOpen(false)}
                        >
                          Create Account
                        </Link>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            )}

            {/* Cart */}
            <button
              onClick={openCart}
              className={cn("relative p-2 rounded-full transition-colors", iconHover)}
              aria-label={`Cart, ${totalItems} items`}
            >
              <ShoppingBag className="h-6 w-6" strokeWidth={iconStroke} />
              {totalItems > 0 && (
                <span
                  className={cn(
                    "absolute -top-0.5 -right-0.5 text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center font-bold",
                    isHome ? "bg-neutral-900 text-white" : "bg-white text-brand-500"
                  )}
                >
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
              variant={isHome ? "minimal" : "default"}
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
            <div
              className={cn(
                "border-t",
                isHome ? "border-neutral-200" : "border-[var(--color-primary-text)]/10"
              )}
            />
            <div
              className={cn(
                "flex items-center overflow-hidden whitespace-nowrap",
                isHome
                  ? "justify-center gap-8 py-3.5 text-[11px] font-medium tracking-[0.18em]"
                  : "gap-5 py-3 text-sm font-semibold"
              )}
            >
              {navCategories.map((cat) => {
                const hasChildren = (cat.children?.length ?? 0) > 0;
                return (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.slug}`}
                    title={cat.name}
                    onMouseEnter={() => setActiveCat(hasChildren ? cat.id : null)}
                    className={cn(
                      "shrink-0 uppercase flex items-center gap-1.5",
                      isHome
                        ? cn(
                            "border-b pb-1 -mb-1 transition-colors",
                            activeCat === cat.id
                              ? "border-neutral-900 text-neutral-900"
                              : "border-transparent text-neutral-600 hover:text-neutral-900"
                          )
                        : cn(
                            "transition-opacity",
                            activeCat === cat.id
                              ? "opacity-100"
                              : "opacity-90 hover:opacity-100"
                          )
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
                className={cn(
                  "absolute left-0 right-0 top-full border-t animate-fade-up",
                  isHome
                    ? "bg-white text-neutral-900 border-neutral-200 shadow-[0_24px_48px_-32px_rgba(0,0,0,0.45)]"
                    : "bg-brand-500 text-[var(--color-primary-text)] border-[var(--color-primary-text)]/10 shadow-lg"
                )}
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {cat.children.map((child) => (
                      <div key={child.id} className="mb-2 min-w-0">
                        <div className="transform hover:translate-x-1 transition-transform ease-in-out duration-300">
                          <Link
                            href={`/products?category=${child.slug}`}
                            onClick={() => setActiveCat(null)}
                            className={cn(
                              "block truncate uppercase",
                              isHome
                                ? "text-[11px] font-medium tracking-[0.16em]"
                                : "text-xs font-medium"
                            )}
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
                              className={cn(
                                "block mt-2 truncate uppercase",
                                isHome
                                  ? "text-[11px] font-light tracking-[0.12em] text-neutral-500 hover:text-neutral-900 transition-colors"
                                  : "text-xs font-light opacity-90"
                              )}
                            >
                              {gc.name}
                            </Link>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div
                    className={cn(
                      "mt-4 pt-4 border-t",
                      isHome ? "border-neutral-200" : "border-[var(--color-primary-text)]/10"
                    )}
                  >
                    <Link
                      href={`/products?category=${cat.slug}`}
                      onClick={() => setActiveCat(null)}
                      className={cn(
                        "inline-flex items-center gap-1 uppercase hover:gap-2 transition-all",
                        isHome
                          ? "text-[10px] font-medium tracking-[0.18em] border-b border-neutral-900 pb-0.5"
                          : "text-xs font-semibold opacity-90 hover:opacity-100"
                      )}
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
