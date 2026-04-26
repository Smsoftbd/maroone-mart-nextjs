"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  loginCustomer,
  registerCustomer,
  logoutCustomer,
  getCustomerProfile,
  updateCustomerProfile,
} from "@/lib/api/customer";
import type { Customer, RegisterData, UpdateProfileData } from "@/lib/api/types";

interface AuthStore {
  customer: Customer | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      customer: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      initialize: async () => {
        const { token } = get();
        if (!token) {
          set({ isLoading: false });
          return;
        }
        try {
          await get().fetchProfile();
        } catch {
          set({ token: null, customer: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await loginCustomer(email, password);
          set({
            token: res.access_token,
            customer: res.customer,
            isAuthenticated: true,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await registerCustomer(data);
          set({
            token: res.access_token,
            customer: res.customer,
            isAuthenticated: true,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        const { token } = get();
        if (token) {
          try {
            await logoutCustomer(token);
          } catch {
            // ignore logout errors
          }
        }
        set({ token: null, customer: null, isAuthenticated: false });
      },

      fetchProfile: async () => {
        const { token } = get();
        if (!token) return;
        const res = await getCustomerProfile(token);
        set({ customer: res.customer, isAuthenticated: true });
      },

      updateProfile: async (data) => {
        const { token } = get();
        if (!token) return;
        set({ isLoading: true });
        try {
          const res = await updateCustomerProfile(token, data);
          set({ customer: res.customer });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token }),
    }
  )
);
