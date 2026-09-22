"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/I18nProvider";
import { setTrackingUserData, track } from "@/lib/analytics/track";
import { buildMetaUserData } from "@/lib/analytics/meta-shared";

interface NewsletterSectionProps {
  title?: string | null;
  subtitle?: string | null;
  /** page.newsletter_style ("hidden" is filtered out by the page). */
  variant?: "card" | "band" | "minimal";
}

/** Homepage email signup; look from page.newsletter_style, colors section.newsletter_*. */
export function NewsletterSection({ title, subtitle, variant = "card" }: NewsletterSectionProps) {
  const t = useT();
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
      setTrackingUserData(buildMetaUserData({ email }));
      track.lead();
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section
      data-reveal
      className={
        variant === "band"
          ? "home-section newsletter bg-[var(--color-section-newsletter-bg,var(--color-primary-soft))] text-[var(--color-section-newsletter-text,var(--color-text-primary))] !py-16"
          : "home-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      }
    >
      <div
        className={
          variant === "card"
            ? "newsletter mx-auto rounded-[var(--shape-section-radius,1rem)] bg-[var(--color-section-newsletter-bg,var(--color-primary-soft))] px-4 py-12 text-center text-[var(--color-section-newsletter-text,var(--color-text-primary))] sm:py-14"
            : variant === "minimal"
            ? "mx-auto border-y [border-style:var(--shape-divider-style,solid)] border-[var(--color-border)] px-4 py-10 text-center"
            : "mx-auto max-w-2xl px-4 text-center"
        }
      >
        <Mail className="h-10 w-10 mx-auto mb-4" />
        <h2 className="font-display text-3xl font-bold mb-2">
          {title || t("newsletter_title", "Stay in the Loop")}
        </h2>
        <p className="opacity-80 mb-8">
          {subtitle || t("newsletter_desc", "Subscribe to get exclusive deals, new arrivals, and insider-only offers.")}
        </p>

        {status === "success" ? (
          <p className="font-medium">
            {t("newsletter_success", "Thank you for subscribing!")}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("email_placeholder", "your@email.com")}
              required
              className="input min-w-0 flex-1 px-4 py-2.5 text-sm"
              aria-label={t("email", "Email")}
            />
            <Button
              type="submit"
              variant="accent"
              className="!bg-[var(--color-section-newsletter-button-bg,var(--color-tertiary-500))] !text-[var(--color-section-newsletter-button-text,var(--color-tertiary-text))] hover:opacity-90"
              loading={status === "loading"}
            >
              {t("subscribe", "Subscribe")}
            </Button>
          </form>
        )}

        {status === "error" && (
          <p className="mt-2 text-sm font-medium">
            {t("newsletter_error", "Something went wrong. Please try again.")}
          </p>
        )}
      </div>
    </section>
  );
}
