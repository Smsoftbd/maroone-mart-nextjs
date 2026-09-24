"use client";

import { createContext, useContext } from "react";
import type { AuthMode, StoreTheme } from "@/lib/api/types";
import { DEFAULT_THEME } from "@/lib/utils/theme";

export interface StoreConfig {
  authMode: AuthMode;
  guestCheckout: boolean;
  checkoutOtp: boolean;
  /** Wishlist module on (product cards show the heart only then). */
  wishlist: boolean;
  /** Appearance choice tokens (layout, page, product, effects …). */
  theme: StoreTheme;
}

const StoreConfigContext = createContext<StoreConfig>({
  authMode: "email_password",
  guestCheckout: true,
  checkoutOtp: false,
  wishlist: false,
  theme: DEFAULT_THEME,
});

export function StoreConfigProvider({
  value,
  children,
}: {
  value: StoreConfig;
  children: React.ReactNode;
}) {
  return (
    <StoreConfigContext.Provider value={value}>
      {children}
    </StoreConfigContext.Provider>
  );
}

export function useStoreConfig(): StoreConfig {
  return useContext(StoreConfigContext);
}

/** Appearance choice tokens for client components. */
export function useTheme(): StoreTheme {
  return useContext(StoreConfigContext).theme;
}
