"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Phone, Search, ShoppingBag, ShoppingBasket, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/stores/cartStore";
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
 * Site header, like the Marooned storefront: one maroon block with
 *   1. logo · pill search field · "Call Us Now" hotline · cart and language
 *   2. under a faint rule, every top-level category as a bold uppercase link
 *      (children drop down below it).
 * Phones get menu button · logo · search + cart; the drawer holds the menu.
 */
export function HomeNavbar({ store, categories, scrolled }: HomeNavbarProps) {
  const t = useT();
  const totalItems = useCartStore((s) => s.totalItems);
  const openCart = useCartStore((s) => s.openCart);
  const { isSearchOpen, toggleSearch, closeSearch, toggleMobileNav } = useUiStore();
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const layout = store.theme.layout;
  const CartIcon = CART_ICONS[layout.cart_icon];
  const menuCategories = categories.filter(isMenuCategory);
  const phone = store.phone.split(/[,/]/)[0]?.trim();

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
    <span className="font-display text-2xl font-bold uppercase">{store.name}</span>
  );

  const close = () => setOpenMenu(null);

  return (
    <header
      className={cn(
        "site-header mr-header z-40",
        layout.sticky_header ? "sticky top-0" : "relative",
        scrolled && "is-scrolled"
      )}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mr-header-row">
          <button
            className="mr-icon-btn -ml-1.5 lg:hidden"
            onClick={toggleMobileNav}
            aria-label={t("open_menu", "Open menu")}
          >
            <Menu className="h-6 w-6" strokeWidth={1.75} />
          </button>

          <Link href="/" className="mr-header-logo" aria-label={store.name}>
            {logo}
          </Link>

          <SearchBox
            categories={categories}
            currency={store.currency_symbol}
            className="mr-header-search hidden lg:block"
            variant="compact"
          />

          {phone && (
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="mr-hotline hidden xl:flex">
              <Phone className="h-[22px] w-[22px] fill-current" strokeWidth={0} />
              <span>
                <span className="block">{t("call_us_now", "Call Us Now")}</span>
                <span className="block">{phone}</span>
              </span>
            </a>
          )}

          <div className="mr-header-actions">
            <button
              className="mr-icon-btn lg:hidden"
              onClick={toggleSearch}
              aria-label={t("search", "Search")}
              aria-expanded={isSearchOpen}
            >
              <Search className="h-[22px] w-[22px]" strokeWidth={1.75} />
            </button>

            <button
              onClick={openCart}
              className="mr-icon-btn cart-icon-btn relative"
              aria-label={`Cart, ${totalItems} items`}
            >
              <CartIcon className="h-6 w-6" strokeWidth={1.5} />
              {totalItems > 0 && <span className="cart-badge">{totalItems > 99 ? "99+" : totalItems}</span>}
            </button>

            {store.languages.length > 1 && (
              <LanguageSwitcher languages={store.languages} buttonClassName="mr-lang" />
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
              variant="compact"
            />
          </div>
        )}

        {/* Row 2: the category menu (desktop; phones use the drawer). */}
        <nav className="mr-nav hidden lg:block" onMouseLeave={close} aria-label={t("main_menu", "Main menu")}>
          <ul className="mr-nav-list">
            {menuCategories.map((cat) => {
              const href = `/products?category=${cat.slug}`;
              const children = (cat.children ?? []).filter(isMenuCategory);
              return (
                <li
                  key={cat.id}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(children.length ? cat.id : null)}
                >
                  <Link
                    href={href}
                    className="mr-nav-link"
                    aria-expanded={children.length ? openMenu === cat.id : undefined}
                    onClick={close}
                  >
                    {cat.name}
                  </Link>
                  {openMenu === cat.id && children.length > 0 && (
                    <div className="mr-dropdown">
                      {children.map((child) => (
                        <Link key={child.id} href={`/products?category=${child.slug}`} onClick={close}>
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
