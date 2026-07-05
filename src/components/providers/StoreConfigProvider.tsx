"use client";

import { createContext, useContext } from "react";
import type { AuthMode } from "@/lib/api/types";

export interface StoreConfig {
  authMode: AuthMode;
  guestCheckout: boolean;
  checkoutOtp: boolean;
}

const StoreConfigContext = createContext<StoreConfig>({
  authMode: "email_password",
  guestCheckout: true,
  checkoutOtp: false,
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
