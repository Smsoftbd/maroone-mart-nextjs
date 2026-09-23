"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { setTrackingUserData, track } from "@/lib/analytics/track";
import { buildMetaUserData } from "@/lib/analytics/meta-shared";

interface FooterNewsletterProps {
  label: string;
  placeholder: string;
  button: string;
  success: string;
}

/** Small email signup under the footer logo (page.footer_newsletter). */
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
    <form onSubmit={submit} className="space-y-2.5">
      <label htmlFor="footer-newsletter" className="block text-[13px] leading-relaxed">
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
          <Send className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
      </div>
      {status === "error" && <p className="text-xs">Something went wrong. Please try again.</p>}
    </form>
  );
}
