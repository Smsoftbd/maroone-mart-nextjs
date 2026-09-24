"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Heart,
  RotateCcw,
  Star,
  User,
  Truck,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/lib/stores/authStore";
import { appToast } from "@/lib/utils/toast";

const links = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/track-order", label: "Track Order", icon: Truck },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/returns", label: "Returns", icon: RotateCcw },
  { href: "/account/loyalty", label: "Loyalty Points", icon: Star },
  { href: "/account/profile", label: "Profile", icon: User },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const [loggingOut, setLoggingOut] = useState(false);

  // Account layout redirects to /login once isAuthenticated flips to false;
  // /track-order just drops back to its guest layout.
  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    appToast.logoutSuccess();
  };

  return (
    <aside className="w-full md:w-56 shrink-0">
      <nav className="bg-surface border border-[var(--color-border)] rounded-xl overflow-hidden">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-[var(--color-border)] last:border-0",
                active
                  ? "bg-brand-50 text-brand-ink"
                  : "text-[var(--color-text-secondary)] hover:bg-surface-50"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </nav>
    </aside>
  );
}
