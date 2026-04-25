"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroBanner as HeroBannerType } from "@/lib/api/types";

interface HeroBannerProps {
  banners: HeroBannerType[];
}

export function HeroBanner({ banners }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % banners.length),
    [banners.length]
  );
  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + banners.length) % banners.length),
    [banners.length]
  );

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, isPaused, banners.length]);

  if (!banners.length) return null;

  const banner = banners[current];

  return (
    <section
      className="relative h-64 sm:h-80 md:h-96 lg:h-[520px] overflow-hidden bg-surface-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {banner.image && (
            <Image
              src={banner.image}
              alt={banner.title}
              fill
              priority={current === 0}
              sizes="100vw"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

          {/* Text */}
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-24">
            <motion.h1
              className="font-display text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold max-w-xl leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {banner.title}
            </motion.h1>
            {banner.subtitle && (
              <motion.p
                className="font-body text-white/80 mt-3 text-sm sm:text-base max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {banner.subtitle}
              </motion.p>
            )}
            {banner.link && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6"
              >
                <Link
                  href={banner.link}
                  className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-body font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  Shop Now
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors z-10"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors z-10"
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-6 bg-white"
                    : "w-2 bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === current}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
