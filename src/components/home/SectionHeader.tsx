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
  /** Extra row under the title (e.g. the category tabs). */
  children?: React.ReactNode;
}

/**
 * Homepage section title, like the reference storefront: an uppercase title
 * centered between two short rules, optional subtitle and tabs under it.
 * Like the reference there is no desktop "View all"; phones get MobileViewAll.
 */
export function SectionHeader({ title, subtitle, icon, inverted, children }: SectionHeaderProps) {
  const ink = inverted ? "text-[var(--color-section-category-band-text,var(--color-secondary-text))]" : "";
  return (
    <div className={`section-head pf-section-head ${ink}`}>
      <h2 className={`section-title pf-section-title ${ink}`}>
        <span className="pf-section-rule" aria-hidden />
        <span className="pf-section-text">
          {icon}
          {title}
        </span>
        <span className="pf-section-rule" aria-hidden />
      </h2>
      {subtitle && <p className="pf-section-sub">{subtitle}</p>}
      {children}
    </div>
  );
}

/** Phones: full-width outlined "View all" under a section (the header link is desktop-only). */
export function MobileViewAll({ href, label, inverted }: { href?: string; label?: string; inverted?: boolean }) {
  if (!href || !label) return null;
  return (
    <Link href={href} className={`mobile-view-all md:hidden ${inverted ? "is-inverted" : ""}`}>
      {label}
      <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
    </Link>
  );
}
