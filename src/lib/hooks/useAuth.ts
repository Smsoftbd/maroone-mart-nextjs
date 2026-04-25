"use client";

import { useAuthStore } from "@/lib/stores/authStore";

export function useAuth() {
  return useAuthStore();
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuthStore();
  return { isAuthenticated, isLoading };
}
