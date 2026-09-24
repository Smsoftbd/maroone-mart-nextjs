"use client";

import { create } from "zustand";

interface UiStore {
  isCartOpen: boolean;
  isMobileNavOpen: boolean;
  isSearchOpen: boolean;

  openCart: () => void;
  closeCart: () => void;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  isCartOpen: false,
  isMobileNavOpen: false,
  isSearchOpen: false,

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleMobileNav: () => set((s) => ({ isMobileNavOpen: !s.isMobileNavOpen })),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),
}));
