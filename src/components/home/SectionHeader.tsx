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
 * Homepage section title, like the Marooned storefront: a large centered
 * uppercase Poppins title, optional subtitle and tabs under it. "See All"
 * sits under the grid (SeeAllButton), not in the header.
 */
export function SectionHeader({ title, subtitle, icon, inverted, children }: SectionHeaderProps) {
  const ink = inverted ? "text-[var(--color-section-category-band-text,var(--color-secondary-text))]" : "";
  return (
    <div className={`section-head pf-section-head ${ink}`}>
      <h2 className={`section-title pf-section-title ${ink}`}>
        {icon}
        {title}
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

/** Centered outlined "See All" under a product grid. */
export function SeeAllButton({ href, label }: { href?: string; label?: string }) {
  if (!href || !label) return null;
  return (
    <div className="mr-see-all-row">
      <Link href={href} className="mr-see-all">
        {label}
      </Link>
    </div>
  );
}
