"use client";

import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Brand } from "@/lib/api/types";

import "swiper/css";

interface BrandsCarouselProps {
  brands: Brand[];
}

/** The API sends a placeholder image for brands without a logo. */
const logoOf = (brand: Brand) => {
  const url = brand.logo ?? (brand as Brand & { image?: string | null }).image;
  return url && !url.includes("no_image") ? url : null;
};

/**
 * Light-grey band of brand tiles above the footer (every page, like the
 * reference storefront). Five white tiles on desktop, slowly auto-scrolling;
 * a brand without a logo shows its name as a bold wordmark.
 */
export function BrandsCarousel({ brands }: BrandsCarouselProps) {
  if (!brands.length) return null;

  return (
    <section className="pf-brands" aria-label="Brands">
      <div className="max-w-7xl mx-auto">
        <Swiper
          modules={[Autoplay]}
          loop={brands.length > 5}
          autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          breakpoints={{
            0: { slidesPerView: 2.4, spaceBetween: 12 },
            640: { slidesPerView: 4, spaceBetween: 24 },
            1024: { slidesPerView: 5, spaceBetween: 46 },
          }}
        >
          {brands.map((brand) => {
            const logo = logoOf(brand);
            return (
              <SwiperSlide key={brand.id}>
                <Link href={`/products?brands=${brand.id}`} title={brand.name} className="pf-brand-tile">
                  {logo ? (
                    <Image src={logo} alt={brand.name} fill sizes="200px" className="object-contain p-3" />
                  ) : (
                    <span className="pf-brand-word">{brand.name}</span>
                  )}
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}
