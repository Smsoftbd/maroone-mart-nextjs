"use client";

import { useState, useEffect } from "react";
import { HomeNavbar } from "./HomeNavbar";
import type { Brand, Category, Store } from "@/lib/api/types";

interface NavbarProps {
  store: Store;
  categories: Category[];
  brands?: Brand[];
}

/** Every route uses the homepage's single-row white header. */
export function Navbar({ store, categories, brands }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <HomeNavbar store={store} categories={categories} brands={brands} scrolled={scrolled} />;
}
