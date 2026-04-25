"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="bg-surface-100 py-16">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <Mail className="h-10 w-10 text-brand-500 mx-auto mb-4" />
        <h2 className="font-display text-3xl font-bold mb-2">
          Stay in the Loop
        </h2>
        <p className="text-[var(--color-text-secondary)] mb-8">
          Subscribe to get exclusive deals, new arrivals, and insider-only offers.
        </p>

        {status === "success" ? (
          <p className="text-green-600 font-medium">
            Thank you for subscribing!
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              aria-label="Email address"
            />
            <Button
              type="submit"
              variant="primary"
              loading={status === "loading"}
            >
              Subscribe
            </Button>
          </form>
        )}

        {status === "error" && (
          <p className="mt-2 text-sm text-red-600">
            Something went wrong. Please try again.
          </p>
        )}
      </div>
    </section>
  );
}
