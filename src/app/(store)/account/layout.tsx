"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AccountSidebar } from "@/components/layout/AccountSidebar";
import { useAuthStore } from "@/lib/stores/authStore";
import { Spinner } from "@/components/ui/Spinner";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-2xl font-bold mb-6">My Account</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <AccountSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
