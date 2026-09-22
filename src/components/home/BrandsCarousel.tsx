"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { ChevronRight, ImageOff } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { useT } from "@/lib/i18n/I18nProvider";
import type { Brand } from "@/lib/api/types";

import "swiper/css";
import "swiper/css/navigation";

interface BrandsCarouselProps {
  brands: Brand[];
}

export function BrandsCarousel({ brands }: BrandsCarouselProps) {
  const t = useT();
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null);

  if (!brands.length) return null;

  return (
    <section className="home-section brands-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-reveal>
      <SectionHeader title={t("our_brands", "Our Brands")} />

      <div className="relative">
        <Swiper
          modules={[Navigation]}
          spaceBetween={16}
          grabCursor
          watchOverflow
          navigation={{ nextEl }}
          breakpoints={{
            0: { slidesPerView: 3.1, spaceBetween: 8 },
            640: { slidesPerView: 5 },
            1024: { slidesPerView: 8 },
          }}
        >
          {brands.map((brand) => {
            // Some API versions return the logo under `image`.
            const logo = brand.logo ?? (brand as Brand & { image?: string | null }).image;
            return (
            <SwiperSlide key={brand.id}>
              <Link
                href={`/products?brands=${brand.id}`}
                title={brand.name}
                className="relative flex aspect-square items-center max-md:aspect-[118/116] max-md:rounded-xl justify-center overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md"
              >
                {logo ? (
                  <Image src={logo} alt={brand.name} fill sizes="130px" className="object-contain max-md:rounded-xl max-md:p-2.5" />
                ) : (
                  <span className="flex flex-col items-center gap-1 px-2 text-center text-slate-400">
                    <ImageOff className="h-6 w-6" strokeWidth={1.25} />
                    <span className="line-clamp-2 text-xs font-medium">{brand.name}</span>
                  </span>
                )}
              </Link>
            </SwiperSlide>
            );
          })}
        </Swiper>

        <button
          ref={setNextEl}
          aria-label="Next brands"
          className="absolute -right-4 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-slate-700 shadow-md transition-opacity hover:opacity-80 disabled:opacity-0 md:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
