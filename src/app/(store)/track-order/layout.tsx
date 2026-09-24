"use client";

import { AccountShell } from "@/components/layout/AccountShell";
import { useAuthStore } from "@/lib/stores/authStore";

// Public page; logged-in customers get the account sidebar around it.
export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return <AccountShell enabled={isAuthenticated}>{children}</AccountShell>;
}
