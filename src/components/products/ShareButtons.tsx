"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useT } from "@/lib/i18n/I18nProvider";

interface ShareButtonsProps {
  url: string;
  title: string;
}

/** Inner SVG paths, drawn white on the network's own colour. */
const ICON: Record<string, string> = {
  facebook:
    "M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z",
  x: "M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8l164.9-188.5L26.8 48h145.6l100.5 132.9zm-24.8 373.8h39.1L151.1 88h-42z",
  whatsapp:
    "M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 110.9L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z",
  linkedin:
    "M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z",
};

const VIEWBOX: Record<string, string> = {
  facebook: "0 0 320 512",
  x: "0 0 512 512",
  whatsapp: "0 0 448 512",
  linkedin: "0 0 448 512",
};

const COLOR: Record<string, string> = {
  facebook: "#1877F2",
  x: "#111827",
  whatsapp: "#25D366",
  linkedin: "#1155CC",
};

/** "Share:" followed by the round, brand-coloured buttons of the reference. */
export function ShareButtons({ url, title }: ShareButtonsProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const links = [
    { key: "facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { key: "x", href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}` },
    { key: "whatsapp", href: `https://wa.me/?text=${enc(`${title} ${url}`)}` },
    { key: "linkedin", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-[var(--color-text-secondary)]">{t("share", "Share")}:</span>
      {links.map(({ key, href }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${key}`}
          className="share-round"
          style={{ backgroundColor: COLOR[key] }}
        >
          <svg width="17" height="17" viewBox={VIEWBOX[key]} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d={ICON[key]} />
          </svg>
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        aria-label={t("copy_link", "Copy link")}
        title={copied ? t("copied", "Copied!") : t("copy_link", "Copy link")}
        className="share-round"
        style={{ backgroundColor: "#4B5563" }}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
