"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  Truck,
  User,
} from "lucide-react";
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

const CART_ICONS = { bag: ShoppingBag, cart: ShoppingCart, basket: ShoppingBasket };
const iconBtn =
  "rounded-full p-2 text-[var(--color-header-icon,currentColor)] hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]";

/**
 * Site header, two rows like the reference storefront:
 *   1. logo · search field with a solid button · Track Order, account, cart
 *   2. the green "All categories" block (opens the category panel) and the
 *      main navigation.
 * Colors, heights and the sticky behaviour still come from the Appearance
 * theme (see .site-header / .nav-bar in globals.css).
 */
export function HomeNavbar({ store, categories, scrolled }: HomeNavbarProps) {
  const t = useT();
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.totalItems);
  const openCart = useCartStore((s) => s.openCart);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isSearchOpen, toggleSearch, closeSearch, toggleMobileNav } = useUiStore();
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  const layout = store.theme.layout;
  const CartIcon = CART_ICONS[layout.cart_icon];
  const navCategories = categories.slice(0, 14);

  // The category panel is a hover/click menu; close it on an outside press.
  useEffect(() => {
    if (!catOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!catRef.current?.contains(e.target as Node)) setCatOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCatOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [catOpen]);

  const navLinks = [
    { href: "/", label: t("home", "Home") },
    { href: "/products", label: t("shop", "Shop") },
    { href: "/flash-sale", label: t("promotion", "Promotion") },
    { href: "/track-order", label: t("track_order", "Track Order") },
    { href: "/contact", label: t("contact_us", "Contact Us") },
  ];

  return (
    <>
      <header
        className={cn(
          "site-header z-40",
          layout.sticky_header ? "sticky top-0" : "relative",
          scrolled && "is-scrolled"
        )}
      >
        <div className="max-w-7xl mx-auto">
          <div className="header-row flex items-center gap-3 lg:gap-6">
            {/* Phones/tablets: the drawer menu button. */}
            <button
              className={cn("-ml-2 lg:hidden", iconBtn)}
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
                  width={220}
                  height={64}
                  className="site-logo w-auto max-w-[140px] object-contain lg:max-w-[190px]"
                  priority
                />
              ) : (
                <span className="font-display text-xl font-bold lg:text-2xl">{store.name}</span>
              )}
            </Link>

            {/* Centered search field. */}
            <SearchBox
              categories={categories}
              currency={store.currency_symbol}
              className="mx-auto hidden w-full max-w-[580px] lg:block"
              variant="minimal"
            />

            <div className="ml-auto flex items-center gap-2 lg:gap-3">
              <button
                className={cn(iconBtn, "lg:hidden")}
                onClick={toggleSearch}
                aria-label={t("search", "Search")}
                aria-expanded={isSearchOpen}
              >
                <Search className="h-6 w-6" />
              </button>

              <Link href="/track-order" className="header-pill hidden lg:inline-flex">
                <Truck className="h-[18px] w-[18px]" strokeWidth={1.75} />
                {t("track_order", "Track Order")}
              </Link>

              {store.auth_mode !== "guest_only" && (
                <Link
                  href={isAuthenticated ? "/account" : "/login"}
                  className="header-round hidden lg:inline-flex"
                  aria-label={t("account", "Account")}
                >
                  <User className="h-5 w-5" strokeWidth={1.75} />
                </Link>
              )}

              <button
                onClick={openCart}
                className="header-round cart-icon-btn"
                aria-label={`Cart, ${totalItems} items`}
              >
                <CartIcon className="h-5 w-5" strokeWidth={1.75} />
                {totalItems > 0 && (
                  <span className="cart-badge">{totalItems > 99 ? "99+" : totalItems}</span>
                )}
              </button>

              <ColorSchemeToggle className={cn(iconBtn, "hidden sm:flex")} />

              <LanguageSwitcher
                languages={store.languages}
                buttonClassName="header-icon-btn h-10 gap-1.5 rounded-full px-3"
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

      {/* Row 2: category block + main nav (desktop only; phones use the drawer). */}
      <div className="nav-bar hidden lg:block">
        <div className="max-w-7xl mx-auto">
          <div className="nav-bar-row">
            {navCategories.length > 0 && (
              <div
                ref={catRef}
                className="relative"
                onMouseEnter={() => setCatOpen(true)}
                onMouseLeave={() => setCatOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setCatOpen((o) => !o)}
                  aria-expanded={catOpen}
                  className="nav-cats-btn"
                >
                  <Menu className="h-[18px] w-[18px]" strokeWidth={2} />
                  {t("all_categories", "All Categories")}
                </button>

                {catOpen && (
                  <div className="cat-list nav-cats-panel">
                    {navCategories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/products?category=${cat.slug}`}
                        onClick={() => setCatOpen(false)}
                      >
                        {cat.image ? (
                          <Image
                            src={cat.image}
                            alt=""
                            width={22}
                            height={22}
                            className="h-[22px] w-[22px] shrink-0 rounded object-cover"
                          />
                        ) : (
                          <Menu className="h-4 w-4 shrink-0 opacity-50" />
                        )}
                        <span className="truncate">{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <nav className="header-nav flex items-stretch">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={pathname === l.href ? "page" : undefined}
                  className="header-nav-link"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
