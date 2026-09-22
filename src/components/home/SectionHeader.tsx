import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string | null;
  icon?: React.ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Text for the category band (section.category_band_text). */
  inverted?: boolean;
}

/**
 * Homepage section title. Alignment (page.section_title_align) and decoration
 * (page.section_title_decor) come from body attributes via .section-head /
 * .section-title in globals.css.
 */
export function SectionHeader({ title, subtitle, icon, viewAllHref, viewAllLabel, inverted }: SectionHeaderProps) {
  const ink = inverted ? "text-[var(--color-section-category-band-text,var(--color-secondary-text))]" : "";
  return (
    <div
      className={`section-head mb-4 flex items-end justify-between gap-x-4 gap-y-2 md:mb-6 ${
        inverted ? "" : "md:border-b [border-bottom-style:var(--shape-divider-style,solid)] border-[var(--color-border)] md:pb-4"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className={`section-title flex items-center gap-2 text-xl font-bold ${ink}`}>
          {icon}
          {title}
        </h2>
        {subtitle && <p className={`text-sm opacity-80 ${ink || "text-[var(--color-text-secondary)]"}`}>{subtitle}</p>}
      </div>
      {viewAllHref && viewAllLabel && (
        <Link
          href={viewAllHref}
          className={`section-link hidden shrink-0 items-center gap-1.5 text-sm md:flex font-medium transition-opacity hover:opacity-75 ${ink}`}
        >
          {viewAllLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

/** Phones: full-width outlined "View all" under a section (the header link is desktop-only). */
export function MobileViewAll({ href, label, inverted }: { href?: string; label?: string; inverted?: boolean }) {
  if (!href || !label) return null;
  return (
    <Link href={href} className={`mobile-view-all md:hidden ${inverted ? "is-inverted" : ""}`}>
      {label}
      <ArrowRight className="h-5 w-5" strokeWidth={1.75} />
    </Link>
  );
}
