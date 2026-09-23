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
  /** Homepage section settings (Appearance → Sections → Banner). */
  autoplay?: boolean;
  /** Seconds between slides. */
  interval?: number;
}

/**
 * Homepage hero: the banner slider inside `.hero`. page.hero_style,
 * hero_height and effects.gradient_hero shape the frame (globals.css).
 */
export function Slider({ sliders, autoplay = true, interval = 5 }: SliderProps) {
  const [dotsEl, setDotsEl] = useState<HTMLDivElement | null>(null);

  if (!sliders.length) return null;

  return (
    <section className="banner hero-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-5">
      <div className="relative">
        <Swiper
          modules={[EffectFade, Autoplay, Pagination]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={1200}
          loop={sliders.length > 1}
          autoplay={autoplay && sliders.length > 1 ? { delay: interval * 1000, disableOnInteraction: false } : false}
          pagination={{ el: dotsEl, clickable: true }}
          watchSlidesProgress
          className="hero-slider hero-frame bg-[var(--color-card-image-bg,var(--color-surface-100))]"
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
                <div className="hero-slide relative">
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
          <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2 rounded-xl bg-[var(--color-surface-0)] px-4 py-2">
            <div ref={setDotsEl} className="home-dots home-dots-brand flex items-center justify-center" />
          </div>
        )}
      </div>
    </section>
  );
}
