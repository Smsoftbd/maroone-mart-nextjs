"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { SectionHeader } from "./SectionHeader";
import { useT } from "@/lib/i18n/I18nProvider";
import type { HomepageCategory } from "@/lib/api/types";

import "swiper/css";
import "swiper/css/pagination";

interface PopularCategoriesProps {
  categories: HomepageCategory[];
}

export function PopularCategories({ categories }: PopularCategoriesProps) {
  const t = useT();
  const [dotsEl, setDotsEl] = useState<HTMLDivElement | null>(null);

  if (!categories.length) return null;

  return (
    <section className="bg-gradient-to-r from-secondary-500 to-[color-mix(in_srgb,var(--color-secondary)_75%,#10b981)] py-10 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title={t("popular_categories", "Popular Categories")}
          viewAllHref="/categories"
          viewAllLabel={t("view_all", "View All")}
          inverted
        />

        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={16}
          grabCursor
          watchOverflow
          autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          pagination={{ el: dotsEl, clickable: true }}
          breakpoints={{
            0: { slidesPerView: 3.3, slidesPerGroup: 3 },
            640: { slidesPerView: 4, slidesPerGroup: 4 },
            1024: { slidesPerView: 6, slidesPerGroup: 6 },
          }}
        >
          {categories.map((cat) => (
            <SwiperSlide key={cat.id}>
              <Link
                href={`/products?category=${cat.slug}`}
                className="group flex flex-col items-center gap-3 text-center"
              >
                <span className="relative flex aspect-square w-full max-w-[140px] items-center justify-center overflow-hidden rounded-full bg-white p-3 shadow-sm ring-4 ring-white/30 transition-transform duration-300 group-hover:-translate-y-1">
                  {cat.image ? (
                    <span className="relative block h-full w-full overflow-hidden rounded-full">
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        sizes="140px"
                        className="object-cover"
                      />
                    </span>
                  ) : (
                    <span className="text-3xl font-bold text-brand-ink">{cat.name[0]}</span>
                  )}
                </span>
                <span className="line-clamp-2 text-xs font-medium text-[var(--color-secondary-text)] sm:text-sm">
                  {cat.name}
                </span>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>

        <div ref={setDotsEl} className="home-dots home-dots-secondary mt-6 flex justify-center" />
      </div>
    </section>
  );
}
