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
    <div className={`section-head ruled-head mb-4 md:mb-6 ${ink}`}>
      <div className="flex min-w-0 shrink-0 flex-col gap-1">
        <h2 className={`section-title ruled-title flex items-center gap-2 ${ink}`}>
          {icon}
          {title}
        </h2>
        {subtitle && (
          <p className={`text-sm normal-case tracking-normal opacity-80 ${ink || "text-[var(--color-text-secondary)]"}`}>
            {subtitle}
          </p>
        )}
      </div>
      <span className="ruled-rule" aria-hidden />
      {viewAllHref && viewAllLabel && (
        <Link href={viewAllHref} className={`section-link ruled-link hidden md:inline-flex ${ink}`}>
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
