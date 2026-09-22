import Image from "next/image";
import Link from "next/link";
import type { HeroBanner } from "@/lib/api/types";

interface PromoBannersProps {
  banners: HeroBanner[];
}

function BannerTile({ banner, className, sizes }: { banner: HeroBanner; className: string; sizes: string }) {
  const img = (
    <Image
      src={banner.image}
      alt={banner.title || "Banner"}
      fill
      sizes={sizes}
      className="object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
  const cls = `group relative block overflow-hidden rounded-2xl bg-surface-100 ${className}`;
  return banner.link ? (
    <Link href={banner.link} aria-label={banner.title || "Banner"} className={cls}>
      {img}
    </Link>
  ) : (
    <div className={cls}>{img}</div>
  );
}

/**
 * Bento promo row: one large tile, two stacked tiles and one tall tile.
 * Degrades to a plain grid when fewer than four banners are configured.
 */
export function PromoBanners({ banners }: PromoBannersProps) {
  const items = [...banners].sort((a, b) => a.sort_order - b.sort_order).filter((b) => b.image);
  if (!items.length) return null;

  if (items.length < 4) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`grid gap-4 ${items.length === 1 ? "" : items.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          {items.map((b) => (
            <BannerTile key={b.id} banner={b} className="aspect-[16/9]" sizes="(min-width: 768px) 33vw, 100vw" />
          ))}
        </div>
      </section>
    );
  }

  const [large, top, bottom, tall] = items;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-[5fr_4fr_2fr] lg:grid-rows-2">
        <BannerTile
          banner={large}
          className="col-span-2 aspect-[16/10] lg:col-span-1 lg:row-span-2 lg:aspect-auto"
          sizes="(min-width: 1024px) 45vw, 100vw"
        />
        <BannerTile banner={top} className="aspect-[16/10] lg:aspect-auto lg:min-h-[160px]" sizes="(min-width: 1024px) 36vw, 50vw" />
        <BannerTile
          banner={tall}
          className="row-span-2 lg:col-start-3 lg:row-start-1"
          sizes="(min-width: 1024px) 18vw, 50vw"
        />
        <BannerTile banner={bottom} className="aspect-[16/10] lg:aspect-auto lg:min-h-[160px]" sizes="(min-width: 1024px) 36vw, 50vw" />
      </div>
    </section>
  );
}
