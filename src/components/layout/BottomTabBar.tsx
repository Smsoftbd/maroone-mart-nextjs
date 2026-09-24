"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, MessageCircle, Phone, ShoppingBag, ShoppingBasket, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/stores/cartStore";
import { useTheme } from "@/components/providers/StoreConfigProvider";
import { useT } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils/cn";

const CART_ICONS = { bag: ShoppingBag, cart: ShoppingCart, basket: ShoppingBasket };

interface BottomTabBarProps {
  /** Messenger / WhatsApp link for the chat tab. */
  chatUrl?: string;
  /** Store hotline for the call tab. */
  phone?: string;
}

/**
 * Phone tab bar: Home, Categories, Cart, Chat, Call. Always shown below `md`;
 * tablets get it too when layout.mobile_nav = bottom.
 */
export function BottomTabBar({ chatUrl, phone }: BottomTabBarProps) {
  const { layout } = useTheme();
  const t = useT();
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.totalItems);
  const openCart = useCartStore((s) => s.openCart);

  // Checkout and product pages carry their own sticky action bar.
  if (pathname.startsWith("/checkout") || /^\/products\/[^/]+/.test(pathname)) return null;

  const CartIcon = CART_ICONS[layout.cart_icon];
  const item = "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium";
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const tel = phone?.split(/[,/]/)[0]?.replace(/[^\d+]/g, "");

  return (
    <nav
      className={cn("bottom-tab-bar", layout.mobile_nav === "bottom" ? "lg:hidden" : "md:hidden")}
      aria-label={t("main_menu", "Main menu")}
    >
      <Link href="/" className={item} aria-current={active("/") ? "page" : undefined}>
        <Home className="h-[22px] w-[22px]" strokeWidth={1.5} />
        {t("home", "Home")}
      </Link>
      <Link href="/categories" className={item} aria-current={active("/categories") ? "page" : undefined}>
        <LayoutGrid className="h-[22px] w-[22px]" strokeWidth={1.5} />
        {t("category", "Category")}
      </Link>
      <button type="button" className={cn(item, "cart-icon-btn relative")} onClick={openCart}>
        <span className="relative">
          <CartIcon className="h-[22px] w-[22px]" strokeWidth={1.5} />
          {totalItems > 0 && (
            <span className="cart-badge absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[11px] font-semibold">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </span>
        {t("cart", "Cart")}
      </button>
      {chatUrl && (
        <a href={chatUrl} target="_blank" rel="noopener noreferrer" className={item}>
          <MessageCircle className="h-[22px] w-[22px]" strokeWidth={1.5} />
          {t("chat", "Chat")}
        </a>
      )}
      {tel && (
        <a href={`tel:${tel}`} className={item}>
          <Phone className="h-[22px] w-[22px]" strokeWidth={1.5} />
          {t("call", "Call")}
        </a>
      )}
    </nav>
  );
}
