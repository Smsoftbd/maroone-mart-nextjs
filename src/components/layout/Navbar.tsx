"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Heart,
  ShoppingBag,
  User,
  LogOut,
  Package,
  X,
} from "lucide-react";
import { useCartStore } from "@/lib/stores/cartStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUiStore } from "@/lib/stores/uiStore";
import { cn } from "@/lib/utils/cn";
import type { Category, Store } from "@/lib/api/types";

interface NavbarProps {
  store: Store;
  categories: Category[];
}

export function Navbar({ store, categories }: NavbarProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const totalItems = useCartStore((s) => s.totalItems);
  const openCart = useCartStore((s) => s.openCart);
  const { customer, isAuthenticated, logout } = useAuthStore();
  const { isSearchOpen, openSearch, closeSearch, toggleMobileNav } = useUiStore();
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      closeSearch();
      setSearchQuery("");
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-white shadow-sm border-b border-[var(--color-border)]"
          : "bg-white/95 backdrop-blur-sm"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          {/* Mobile: hamburger */}
          <button
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-surface-100 transition-colors"
            onClick={toggleMobileNav}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            {store.logo ? (
              <Image
                src={store.logo}
                alt={store.name}
                width={120}
                height={40}
                className="h-8 w-auto object-contain"
                priority
              />
            ) : (
              <span className="font-display text-xl font-bold text-brand-500">
                {store.name}
              </span>
            )}
          </Link>

          {/* Desktop: category nav */}
          <div className="hidden lg:flex items-center gap-6 ml-8">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-brand-500 transition-colors whitespace-nowrap"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <div className="flex-1" />

          {/* Search expand */}
          {isSearchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-xs">
              <input
                autoFocus
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button type="button" onClick={closeSearch} aria-label="Close search">
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={openSearch}
                className="p-2 rounded-full hover:bg-surface-100 transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {store.features.wishlist && (
                <Link
                  href="/account/wishlist"
                  className="p-2 rounded-full hover:bg-surface-100 transition-colors"
                  aria-label="Wishlist"
                >
                  <Heart className="h-5 w-5" />
                </Link>
              )}

              {/* Account dropdown */}
              <div className="relative">
                <button
                  onClick={() => setAccountOpen((o) => !o)}
                  className="p-2 rounded-full hover:bg-surface-100 transition-colors"
                  aria-label="Account"
                >
                  <User className="h-5 w-5" />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[var(--color-border)] rounded-xl shadow-lg py-2 z-50">
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
                className="relative flex items-center gap-2 ml-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-medium"
                aria-label={`Cart, ${totalItems} items`}
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Cart</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-surface-900 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
