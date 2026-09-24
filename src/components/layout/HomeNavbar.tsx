"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Heart,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
} from "lucide-react";
import { useCartStore } from "@/lib/stores/cartStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUiStore } from "@/lib/stores/uiStore";
import { cn } from "@/lib/utils/cn";
import { SearchBox } from "./SearchBox";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useT } from "@/lib/i18n/I18nProvider";
import type { Brand, Category, Store } from "@/lib/api/types";

interface HomeNavbarProps {
  store: Store;
  categories: Category[];
  brands?: Brand[];
  scrolled: boolean;
}

const CART_ICONS = { bag: ShoppingBag, cart: ShoppingCart, basket: ShoppingBasket };

/** Uncategorized is a system bucket, never a menu entry. */
const isMenuCategory = (c: Category) => c.slug !== "uncategorized";

/**
 * Site header, like the reference storefront:
 *   1. grey bar: "Find a store" · centered logo · sign in, wishlist, cart and
 *      the compact search field
 *   2. white bar: centered uppercase menu (Top brands, the top-level
 *      categories, the offers page), each with a full-width dropdown.
 * Phones get menu button · logo · search + cart; the drawer holds the menu.
 */
export function HomeNavbar({ store, categories, brands = [], scrolled }: HomeNavbarProps) {
  const t = useT();
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.totalItems);
  const openCart = useCartStore((s) => s.openCart);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isSearchOpen, toggleSearch, closeSearch, toggleMobileNav } = useUiStore();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const layout = store.theme.layout;
  const CartIcon = CART_ICONS[layout.cart_icon];
  const menuCategories = categories.filter(isMenuCategory).slice(0, 6);
  const storeHref = store.google_map_link || "/contact";

  const logo = store.logo ? (
    <Image
      src={store.logo}
      alt={store.name}
      width={240}
      height={80}
      className="site-logo w-auto object-contain"
      priority
    />
  ) : (
    <span className="font-display text-xl font-bold uppercase lg:text-2xl">{store.name}</span>
  );

  const close = () => setOpenMenu(null);

  return (
    <>
      <header
        className={cn(
          "site-header pf-header z-40",
          layout.sticky_header ? "sticky top-0" : "relative",
          scrolled && "is-scrolled"
        )}
      >
        <div className="max-w-7xl mx-auto">
          <div className="pf-header-row">
            {/* Left: drawer button (phones) / "Find a store" (desktop). */}
            <div className="pf-header-left">
              <button
                className="pf-icon-btn -ml-2 lg:hidden"
                onClick={toggleMobileNav}
                aria-label={t("open_menu", "Open menu")}
              >
                <Menu className="h-6 w-6" strokeWidth={1.5} />
              </button>
              <a
                href={storeHref}
                target={storeHref.startsWith("http") ? "_blank" : undefined}
                rel={storeHref.startsWith("http") ? "noopener noreferrer" : undefined}
                className="pf-header-link hidden lg:inline-flex"
              >
                <MapPin className="h-[19px] w-[19px]" strokeWidth={1.5} />
                {t("find_a_store", "Find a store")}
              </a>
            </div>

            <Link href="/" className="pf-header-logo" aria-label={store.name}>
              {logo}
            </Link>

            <div className="pf-header-right">
              {store.auth_mode !== "guest_only" && (
                <>
                  <Link
                    href={isAuthenticated ? "/account" : "/login"}
                    className="pf-header-link hidden lg:inline-flex"
                  >
                    {isAuthenticated ? t("my_account", "My Account") : t("sign_in", "Sign in")}
                    <ChevronDown className="h-3 w-3" strokeWidth={1.5} />
                  </Link>
                  <span className="pf-header-divider hidden lg:block" aria-hidden />
                </>
              )}
              {store.auth_mode === "guest_only" && (
                <>
                  <Link href="/track-order" className="pf-header-link hidden lg:inline-flex">
                    {t("track_order", "Track Order")}
                  </Link>
                  <span className="pf-header-divider hidden lg:block" aria-hidden />
                </>
              )}

              {store.features.wishlist && (
                <Link
                  href="/account/wishlist"
                  className="pf-icon-btn hidden lg:inline-flex"
                  aria-label={t("wishlist", "Wishlist")}
                >
                  <Heart className="h-[22px] w-[22px]" strokeWidth={1.3} />
                </Link>
              )}

              <button
                className="pf-icon-btn lg:hidden"
                onClick={toggleSearch}
                aria-label={t("search", "Search")}
                aria-expanded={isSearchOpen}
              >
                <Search className="h-[22px] w-[22px]" strokeWidth={1.5} />
              </button>

              <button
                onClick={openCart}
                className="pf-icon-btn cart-icon-btn relative"
                aria-label={`Cart, ${totalItems} items`}
              >
                <CartIcon className="h-[22px] w-[22px]" strokeWidth={1.3} />
                <span className="cart-badge">{totalItems > 99 ? "99+" : totalItems}</span>
              </button>

              <SearchBox
                categories={categories}
                currency={store.currency_symbol}
                className="pf-header-search hidden lg:block"
                variant="compact"
              />

              {store.languages.length > 1 && (
                <LanguageSwitcher
                  languages={store.languages}
                  buttonClassName="pf-header-link h-9 gap-1 px-1"
                />
              )}
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

      {/* Row 2: the centered menu (desktop; phones use the drawer). */}
      <nav className="pf-nav hidden lg:block" onMouseLeave={close} aria-label={t("main_menu", "Main menu")}>
        <ul className="pf-nav-list">
          {brands.length > 0 && (
            <li onMouseEnter={() => setOpenMenu("brands")}>
              <Link
                href="/products"
                className="pf-nav-link"
                aria-expanded={openMenu === "brands"}
                onClick={close}
              >
                {t("top_brands", "Top Brands")}
              </Link>
              {openMenu === "brands" && (
                <div className="pf-mega">
                  <div className="pf-mega-inner pf-mega-brands">
                    {brands.map((b) => (
                      <Link key={b.id} href={`/products?brands=${b.id}`} onClick={close}>
                        {b.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </li>
          )}

          {menuCategories.map((cat) => {
            const href = `/products?category=${cat.slug}`;
            const key = `cat-${cat.id}`;
            const children = cat.children ?? [];
            return (
              <li key={cat.id} onMouseEnter={() => setOpenMenu(children.length ? key : null)}>
                <Link
                  href={href}
                  className="pf-nav-link"
                  aria-expanded={children.length ? openMenu === key : undefined}
                  onClick={close}
                >
                  {cat.name}
                </Link>
                {openMenu === key && children.length > 0 && (
                  <div className="pf-mega">
                    <div className="pf-mega-inner">
                      {children.map((child) => (
                        <div key={child.id} className="pf-mega-col">
                          <Link
                            href={`/products?category=${child.slug}`}
                            className="pf-mega-title"
                            onClick={close}
                          >
                            {child.name}
                          </Link>
                          {(child.children ?? []).slice(0, 8).map((g) => (
                            <Link key={g.id} href={`/products?category=${g.slug}`} onClick={close}>
                              {g.name}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}

          <li onMouseEnter={close}>
            <Link
              href="/flash-sale"
              className="pf-nav-link"
              aria-current={pathname === "/flash-sale" ? "page" : undefined}
            >
              {t("pink_pocket_offer", "Pink Pocket Offer")}
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
