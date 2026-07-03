"use client";

import Image from "next/image";
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
  if (!sliders.length) return null;

  return (
    <section className="banner">
      <Swiper
        modules={[EffectFade, Autoplay, Pagination]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        speed={1200}
        loop={sliders.length > 1}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        watchSlidesProgress
        className="hero-slider"
      >
        {sliders.map((slider, i) => (
          <SwiperSlide key={slider.id}>
            <div className="relative single-hero-slider overflow-hidden bg-top px-3 lg:px-12 md:py-10 text-center flex justify-center items-center h-[213px] md:h-[363px] lg:h-[88vh]">
              {slider.image && (
                <Image
                  src={slider.image}
                  alt="Banner"
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover object-center"
                />
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
