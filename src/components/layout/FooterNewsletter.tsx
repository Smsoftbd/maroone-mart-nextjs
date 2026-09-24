"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { setTrackingUserData, track } from "@/lib/analytics/track";
import { buildMetaUserData } from "@/lib/analytics/meta-shared";

interface FooterNewsletterProps {
  label: string;
  placeholder: string;
  button: string;
  success: string;
}

/** Footer email signup (page.footer_newsletter): label, field and a square arrow button on one row. */
export function FooterNewsletter({ label, placeholder, button, success }: FooterNewsletterProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
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
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") return <p className="text-sm font-medium">{success}</p>;

  return (
    <form onSubmit={submit} className="pf-newsletter-form">
      <label htmlFor="footer-newsletter" className="pf-newsletter-label">
        {label}
      </label>
      <div className="footer-subscribe">
        <input
          id="footer-newsletter"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
        />
        <button type="submit" disabled={status === "loading"} aria-label={button} title={button}>
          <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
      {status === "error" && <p className="w-full text-xs">Something went wrong. Please try again.</p>}
    </form>
  );
}
