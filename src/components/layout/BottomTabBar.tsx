"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, ShoppingBag, ShoppingBasket, ShoppingCart, User } from "lucide-react";
import { useCartStore } from "@/lib/stores/cartStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUiStore } from "@/lib/stores/uiStore";
import { useTheme } from "@/components/providers/StoreConfigProvider";
import { useT } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils/cn";

const CART_ICONS = { bag: ShoppingBag, cart: ShoppingCart, basket: ShoppingBasket };

/** Phone tab bar (Home, Shop, Search, Cart, Account) for layout.mobile_nav = bottom. */
export function BottomTabBar({ guestOnly }: { guestOnly: boolean }) {
  const { layout } = useTheme();
  const t = useT();
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.totalItems);
  const openCart = useCartStore((s) => s.openCart);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openSearch = useUiStore((s) => s.openSearch);

  if (layout.mobile_nav !== "bottom") return null;

  const CartIcon = CART_ICONS[layout.cart_icon];
  const item = "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium";
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="bottom-tab-bar lg:hidden" aria-label={t("main_menu", "Main menu")}>
      <Link href="/" className={item} aria-current={active("/") ? "page" : undefined}>
        <Home className="h-5 w-5" />
        {t("home", "Home")}
      </Link>
      <Link href="/products" className={item} aria-current={active("/products") ? "page" : undefined}>
        <LayoutGrid className="h-5 w-5" />
        {t("shop", "Shop")}
      </Link>
      <button
        type="button"
        className={item}
        onClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          openSearch();
        }}
      >
        <Search className="h-5 w-5" />
        {t("search", "Search")}
      </button>
      <button type="button" className={cn(item, "cart-icon-btn relative")} onClick={openCart}>
        <span className="relative">
          <CartIcon className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="cart-badge absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </span>
        {t("cart", "Cart")}
      </button>
      {!guestOnly && (
        <Link
          href={isAuthenticated ? "/account" : "/login"}
          className={item}
          aria-current={active("/account") ? "page" : undefined}
        >
          <User className="h-5 w-5" />
          {t("account", "Account")}
        </Link>
      )}
    </nav>
  );
}
