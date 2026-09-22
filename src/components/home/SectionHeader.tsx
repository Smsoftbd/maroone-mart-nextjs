import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Text for the category band (section.category_band_text). */
  inverted?: boolean;
}

export function SectionHeader({ title, icon, viewAllHref, viewAllLabel, inverted }: SectionHeaderProps) {
  return (
    <div
      className={
        inverted
          ? "mb-6 flex items-center justify-between gap-4"
          : "mb-6 flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4"
      }
    >
      <h2
        className={`flex items-center gap-2 text-lg font-bold md:text-xl ${inverted ? "text-[var(--color-section-category-band-text,var(--color-secondary-text))]" : "text-[var(--color-section-section-title,var(--color-text-primary))]"}`}
      >
        {icon}
        {title}
      </h2>
      {viewAllHref && viewAllLabel && (
        <Link
          href={viewAllHref}
          className={`flex shrink-0 items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-75 ${inverted ? "text-[var(--color-section-category-band-text,var(--color-secondary-text))]" : "text-[var(--color-section-section-link,var(--color-brand-ink))]"}`}
        >
          {viewAllLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
