"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectFade, Autoplay, Pagination } from "swiper/modules";
import type { Slider as SliderType } from "@/lib/api/types";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

interface SliderProps {
  sliders: SliderType[];
}

export function Slider({ sliders }: SliderProps) {
  const [dotsEl, setDotsEl] = useState<HTMLDivElement | null>(null);

  if (!sliders.length) return null;

  return (
    <section className="banner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-6">
      <div className="relative">
        <Swiper
          modules={[EffectFade, Autoplay, Pagination]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={1200}
          loop={sliders.length > 1}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ el: dotsEl, clickable: true }}
          watchSlidesProgress
          className="hero-slider overflow-hidden rounded-2xl bg-[var(--color-section-hero-bg,var(--color-surface-100))]"
        >
          {sliders.map((slider, i) => {
            const img = slider.image && (
              <Image
                src={slider.image}
                alt="Banner"
                fill
                priority={i === 0}
                sizes="(min-width: 1280px) 1216px, 100vw"
                className="object-cover object-center"
              />
            );
            return (
              <SwiperSlide key={slider.id}>
                <div className="relative aspect-[16/7] md:aspect-[16/6]">
                  {slider.link ? (
                    <Link href={slider.link} aria-label="Banner" className="absolute inset-0">
                      {img}
                    </Link>
                  ) : (
                    img
                  )}
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Dots sit on a white tab notched into the bottom edge of the banner */}
        {sliders.length > 1 && (
          <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 rounded-t-xl bg-[var(--color-section-hero-bg,var(--color-surface))] px-3 pt-2 pb-1.5">
            <div ref={setDotsEl} className="home-dots home-dots-brand flex items-center justify-center" />
          </div>
        )}
      </div>
    </section>
  );
}
