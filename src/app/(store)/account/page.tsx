"use client";

import Link from "next/link";
import { Package, Heart, Star, User } from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";

const quickLinks = [
  { href: "/account/orders", icon: Package, label: "My Orders", desc: "Track and manage orders" },
  { href: "/account/wishlist", icon: Heart, label: "Wishlist", desc: "Saved items" },
  { href: "/account/loyalty", icon: Star, label: "Loyalty Points", desc: "View your balance" },
  { href: "/account/profile", icon: User, label: "Profile", desc: "Update your info" },
];

export default function AccountDashboard() {
  const { customer } = useAuthStore();

  return (
    <div>
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-6 text-white mb-6">
        <p className="text-white/70 text-sm">Welcome back,</p>
        <h2 className="font-display text-2xl font-bold">{customer?.name}</h2>
        <p className="text-white/70 text-sm mt-1">{customer?.email}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quickLinks.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="bg-white border border-[var(--color-border)] rounded-xl p-4 hover:shadow-sm transition-shadow text-center"
          >
            <div className="bg-brand-50 rounded-full p-3 w-fit mx-auto mb-3">
              <Icon className="h-5 w-5 text-[var(--color-tertiary-text)]" />
            </div>
            <p className="font-medium text-sm">{label}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
