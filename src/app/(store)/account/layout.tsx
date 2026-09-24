"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AccountShell } from "@/components/layout/AccountShell";
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
    <AccountShell>{children}</AccountShell>
  );
}
