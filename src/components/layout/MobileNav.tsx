"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, X, User, Package, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUiStore } from "@/lib/stores/uiStore";
import { useAuthStore } from "@/lib/stores/authStore";
import type { Category, Store } from "@/lib/api/types";

interface MobileNavProps {
  store: Store;
  categories: Category[];
}

export function MobileNav({ store, categories }: MobileNavProps) {
  const { isMobileNavOpen, closeMobileNav } = useUiStore();
  const { isAuthenticated, customer, logout } = useAuthStore();
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <AnimatePresence>
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            className="absolute inset-0 bg-[var(--color-misc-overlay,rgba(0,0,0,0.4))]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileNav}
          />
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-80 bg-surface flex flex-col overflow-hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <span className="font-display text-lg font-semibold">{store.name}</span>
              <button
                onClick={closeMobileNav}
                className="p-1.5 rounded-full hover:bg-surface-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-2">
              <Link
                href="/"
                className="block px-5 py-3 text-sm font-medium hover:bg-surface-50"
                onClick={closeMobileNav}
              >
                Home
              </Link>
              <Link
                href="/products"
                className="block px-5 py-3 text-sm font-medium hover:bg-surface-50"
                onClick={closeMobileNav}
              >
                All Products
              </Link>

              {categories.map((cat) => (
                <div key={cat.id}>
                  <div className="flex items-center">
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className="flex-1 px-5 py-3 text-sm font-medium hover:bg-surface-50"
                      onClick={closeMobileNav}
                    >
                      {cat.name}
                    </Link>
                    {cat.children?.length > 0 && (
                      <button
                        className="px-3 py-3 hover:bg-surface-50"
                        onClick={() =>
                          setExpanded((e) => (e === cat.id ? null : cat.id))
                        }
                        aria-label={`Toggle ${cat.name} subcategories`}
                      >
                        {expanded === cat.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {expanded === cat.id && cat.children?.length > 0 && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        {cat.children.map((child) => (
                          <div key={child.id}>
                            <Link
                              href={`/products?category=${child.slug}`}
                              className="block pl-8 pr-5 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-surface-50"
                              onClick={closeMobileNav}
                            >
                              {child.name}
                            </Link>
                            {child.children?.map((gc) => (
                              <Link
                                key={gc.id}
                                href={`/products?category=${gc.slug}`}
                                className="block pl-12 pr-5 py-2 text-xs text-[var(--color-text-muted)] hover:bg-surface-50"
                                onClick={closeMobileNav}
                              >
                                {gc.name}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* Same destinations as the desktop nav bar. */}
              <Link
                href="/flash-sale"
                className="block px-5 py-3 text-sm font-medium hover:bg-surface-50"
                onClick={closeMobileNav}
              >
                Promotion
              </Link>
              <Link
                href="/track-order"
                className="block px-5 py-3 text-sm font-medium hover:bg-surface-50"
                onClick={closeMobileNav}
              >
                Track Order
              </Link>
              <Link
                href="/blog"
                className="block px-5 py-3 text-sm font-medium hover:bg-surface-50"
                onClick={closeMobileNav}
              >
                Blog
              </Link>
              <Link
                href="/contact"
                className="block px-5 py-3 text-sm font-medium hover:bg-surface-50"
                onClick={closeMobileNav}
              >
                Contact Us
              </Link>
            </nav>

            {store.auth_mode !== "guest_only" && (
            <div className="border-t border-[var(--color-border)] py-4 px-5">
              {isAuthenticated ? (
                <div className="space-y-1">
                  <p className="text-xs text-[var(--color-text-muted)] mb-2">
                    Signed in as {customer?.name}
                  </p>
                  <Link
                    href="/account"
                    className="flex items-center gap-2 py-2 text-sm hover:text-brand-ink"
                    onClick={closeMobileNav}
                  >
                    <User className="h-4 w-4" /> Account
                  </Link>
                  <Link
                    href="/account/orders"
                    className="flex items-center gap-2 py-2 text-sm hover:text-brand-ink"
                    onClick={closeMobileNav}
                  >
                    <Package className="h-4 w-4" /> Orders
                  </Link>
                  <button
                    onClick={() => { logout(); closeMobileNav(); }}
                    className="flex items-center gap-2 py-2 text-sm text-red-600 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link
                    href="/login"
                    className="flex-1 text-center py-2.5 border border-surface-900 rounded-lg text-sm font-medium hover:bg-surface-100 transition-colors"
                    onClick={closeMobileNav}
                  >
                    {store.auth_mode === "sms_otp" ? "Login / Sign Up" : "Login"}
                  </Link>
                  {store.auth_mode === "email_password" && (
                    <Link
                      href="/register"
                      className="flex-1 text-center py-2.5 bg-brand-500 text-[var(--color-primary-text)] rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
                      onClick={closeMobileNav}
                    >
                      Sign Up
                    </Link>
                  )}
                </div>
              )}
            </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
