import Image from "next/image";
import Link from "next/link";
import type { HeroBanner } from "@/lib/api/types";

interface PromoBannersProps {
  /** One row of tiles (see groupBanners). */
  banners: HeroBanner[];
}

/**
 * Promo tiles in rows like the reference storefront: four, then three, then
 * four … A short last row keeps its own column count.
 */
export function groupBanners(banners: HeroBanner[]): HeroBanner[][] {
  const items = [...banners].sort((a, b) => a.sort_order - b.sort_order).filter((b) => b.image);
  const rows: HeroBanner[][] = [];
  for (let i = 0, size = 4; i < items.length; i += size, size = size === 4 ? 3 : 4) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

/** One row of 2:1 banner tiles inside the container. */
export function PromoBanners({ banners }: PromoBannersProps) {
  if (!banners.length) return null;
  const cols = banners.length;

  return (
    <section className="pf-promo max-w-7xl mx-auto" data-reveal>
      <div className="pf-promo-row" style={{ "--cols": cols } as React.CSSProperties}>
        {banners.map((b) => {
          const img = (
            <Image
              src={b.image}
              alt={b.title || "Banner"}
              fill
              sizes={`(min-width: 1024px) ${Math.round(1200 / cols)}px, 50vw`}
              className="object-cover"
            />
          );
          return b.link ? (
            <Link key={b.id} href={b.link} aria-label={b.title || "Banner"} className="pf-promo-tile">
              {img}
            </Link>
          ) : (
            <div key={b.id} className="pf-promo-tile">
              {img}
            </div>
          );
        })}
      </div>
    </section>
  );
}
