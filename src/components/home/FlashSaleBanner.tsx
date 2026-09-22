"use client";

import { useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { ArrowRight, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Countdown } from "@/components/ui/Countdown";
import { ProductCard } from "@/components/products/ProductCard";
import { ItemListTracker } from "@/components/analytics/ItemListTracker";
import type { FlashSale } from "@/lib/api/types";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface FlashSaleBannerProps {
  sales: FlashSale[];
  currency: string;
}

const navBtn =
  "hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg text-slate-700 transition-opacity hover:opacity-90 disabled:opacity-0";

export function FlashSaleBanner({ sales, currency }: FlashSaleBannerProps) {
  const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null);
  const [paginationEl, setPaginationEl] = useState<HTMLDivElement | null>(null);

  const sale = sales[0];
  if (!sale) return null;

  return (
    <section className="bg-secondary-500 py-8 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 text-[var(--color-secondary-text)]">
            <Zap className="h-6 w-6 fill-current" />
            <h2 className="font-display text-2xl font-bold">{sale.title}</h2>
            <Link
              href="/flash-sale"
              className="ml-2 text-sm font-medium underline underline-offset-4 opacity-90 hover:opacity-100 whitespace-nowrap"
            >
              View all ({sale.products.length}) →
            </Link>
          </div>
          <div className="text-[var(--color-secondary-text)]">
            <p className="text-xs uppercase tracking-widest opacity-80 mb-1">
              Ends in
            </p>
            <Countdown endsAt={sale.ends_at} />
          </div>
        </div>

        <ItemListTracker
          list={{ id: `home_flash_sale_${sale.id}`, name: `Flash sale: ${sale.title}` }}
          products={sale.products}
        >
          <div className="relative">
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={16}
              grabCursor
              watchOverflow
              rewind
              autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
              navigation={{ prevEl, nextEl }}
              pagination={{ el: paginationEl, clickable: true }}
              breakpoints={{
                0: { slidesPerView: 2.2, slidesPerGroup: 2 },
                640: { slidesPerView: 3.2, slidesPerGroup: 3 },
                768: { slidesPerView: 4, slidesPerGroup: 4 },
                1024: { slidesPerView: 5, slidesPerGroup: 5 },
                1280: { slidesPerView: 6, slidesPerGroup: 6 },
              }}
              className="deals-carousel"
            >
              {sale.products.map((product) => (
                <SwiperSlide key={product.id} className="!h-auto">
                  {/* White panel keeps the chrome-less minimal card legible on the secondary ground */}
                  <div className="h-full bg-white p-3 rounded-lg">
                    <ProductCard
                      product={product}
                      currency={currency}
                      showWishlist={false}
                      variant="minimal"
                    />
                  </div>
                </SwiperSlide>
              ))}
              <SwiperSlide className="!h-auto">
                <Link
                  href="/flash-sale"
                  className="h-full min-h-48 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[var(--color-secondary-text)]/50 hover:border-[var(--color-secondary-text)] hover:bg-[var(--color-secondary-text)]/10 text-[var(--color-secondary-text)] text-sm font-medium transition-colors"
                >
                  <span className="h-12 w-12 rounded-full bg-[var(--color-secondary-text)]/20 flex items-center justify-center">
                    <ArrowRight className="h-6 w-6" />
                  </span>
                  View all deals
                </Link>
              </SwiperSlide>
            </Swiper>

            <button ref={setPrevEl} aria-label="Previous deals" className={`${navBtn} -left-5`}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button ref={setNextEl} aria-label="Next deals" className={`${navBtn} -right-5`}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </ItemListTracker>

        <div ref={setPaginationEl} className="deals-pagination mt-5 flex justify-center" />
      </div>
    </section>
  );
}
