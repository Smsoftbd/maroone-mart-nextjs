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
 * Homepage hero: a full-width banner slider inside `.hero`, dots over the
 * bottom edge. page.hero_height shapes the frame (globals.css).
 */
export function Slider({ sliders, autoplay = true, interval = 5 }: SliderProps) {
  const [dotsEl, setDotsEl] = useState<HTMLDivElement | null>(null);

  if (!sliders.length) return null;

  return (
    <section className="banner hero-inner">
      <div className="hero-banner relative">
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
                sizes="100vw"
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

        {sliders.length > 1 && (
          <div ref={setDotsEl} className="pf-hero-dots absolute inset-x-0 bottom-4 z-10 flex items-center justify-center" />
        )}
      </div>
    </section>
  );
}
