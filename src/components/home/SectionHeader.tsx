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
      className={`section-head mb-6 flex items-end justify-between gap-x-4 gap-y-2 ${
        inverted ? "" : "border-b [border-bottom-style:var(--shape-divider-style,solid)] border-[var(--color-border)] pb-4"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className={`section-title flex items-center gap-2 text-lg font-bold md:text-xl ${ink}`}>
          {icon}
          {title}
        </h2>
        {subtitle && <p className={`text-sm opacity-80 ${ink || "text-[var(--color-text-secondary)]"}`}>{subtitle}</p>}
      </div>
      {viewAllHref && viewAllLabel && (
        <Link
          href={viewAllHref}
          className={`section-link flex shrink-0 items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-75 ${ink}`}
        >
          {viewAllLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
