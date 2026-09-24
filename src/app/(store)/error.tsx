"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <div className="bg-red-50 p-4 rounded-full mb-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
      </div>
      <h2 className="font-display text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-[var(--color-text-secondary)] mb-6 max-w-md">
        We encountered an unexpected error. Please try again.
      </p>
      <Button variant="primary" onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}
