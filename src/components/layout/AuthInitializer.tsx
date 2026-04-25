"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useCartStore } from "@/lib/stores/cartStore";

export function AuthInitializer() {
  const initialize = useAuthStore((s) => s.initialize);
  const token = useAuthStore((s) => s.token);
  const fetchCart = useCartStore((s) => s.fetchCart);

  useEffect(() => {
    initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchCart(token);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
