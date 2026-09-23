"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import type { HomepageCategory } from "@/lib/api/types";

import "swiper/css";
import "swiper/css/navigation";

const arrow =
  "absolute top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-md transition-opacity hover:opacity-80 disabled:cursor-default disabled:opacity-50 md:flex";

/** Fixed-width category cards (square image well + name) in a swipeable row with side arrows. */
export function CategoryCarousel({ categories }: { categories: HomepageCategory[] }) {
  const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null);

  return (
    <div className="relative">
      <Swiper
        modules={[Navigation]}
        slidesPerView="auto"
        spaceBetween={10}
        grabCursor
        watchOverflow
        navigation={{ prevEl, nextEl }}
        breakpoints={{ 768: { spaceBetween: 16 } }}
      >
        {categories.map((cat) => (
          <SwiperSlide key={cat.id} className="!w-[112px] md:!w-[144px]">
            <Link
              href={`/products?category=${cat.slug}`}
              className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md"
            >
              <span className="relative flex aspect-square items-center justify-center bg-surface-100">
                {cat.image ? (
                  <Image src={cat.image} alt={cat.name} fill sizes="144px" className="object-contain" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-slate-300" strokeWidth={1.5} />
                )}
              </span>
              <span className="flex h-12 items-center justify-center px-2 text-center">
                <span className="line-clamp-2 text-xs font-semibold uppercase leading-tight text-slate-700">
                  {cat.name}
                </span>
              </span>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>

      <button ref={setPrevEl} aria-label="Previous categories" className={`${arrow} -left-3`}>
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button ref={setNextEl} aria-label="Next categories" className={`${arrow} -right-3`}>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
