"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Heart,
  RotateCcw,
  Star,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/returns", label: "Returns", icon: RotateCcw },
  { href: "/account/loyalty", label: "Loyalty Points", icon: Star },
  { href: "/account/profile", label: "Profile", icon: User },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-56 shrink-0">
      <nav className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
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
                  ? "bg-brand-50 text-brand-600"
                  : "text-[var(--color-text-secondary)] hover:bg-surface-50"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
