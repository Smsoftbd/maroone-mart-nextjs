"use client";

import { useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { ArrowRight, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Countdown } from "@/components/ui/Countdown";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductGrid } from "@/components/products/ProductGrid";
import { useT } from "@/lib/i18n/I18nProvider";
import { ItemListTracker } from "@/components/analytics/ItemListTracker";
import type { FlashSale } from "@/lib/api/types";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface FlashSaleBannerProps {
  sales: FlashSale[];
  currency: string;
  /** Owner's section title; falls back to the sale's own title. */
  title?: string | null;
  subtitle?: string | null;
  countdown?: boolean;
  limit?: number;
  layout?: "grid" | "slider";
  viewAll?: boolean;
}

const navBtn =
  "hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-surface shadow-lg text-[var(--color-text-primary)] transition-opacity hover:opacity-90 disabled:opacity-0";

/** Active flash sale (commerce.flash_sale_*), boxed with shape.section_radius. */
export function FlashSaleBanner({
  sales,
  currency,
  title,
  subtitle,
  countdown = true,
  limit = 12,
  layout = "slider",
  viewAll = true,
}: FlashSaleBannerProps) {
  const t = useT();
  const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null);
  const [paginationEl, setPaginationEl] = useState<HTMLDivElement | null>(null);

  const sale = sales[0];
  if (!sale) return null;
  const products = sale.products.slice(0, limit);
  const list = { id: `home_flash_sale_${sale.id}`, name: `Flash sale: ${sale.title}` };

  return (
    <section className="home-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-reveal>
      <div className="flash-sale rounded-[var(--shape-section-radius,1rem)] bg-[var(--color-commerce-flash-sale-bg,var(--color-secondary-500))] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="text-[var(--color-commerce-flash-sale-text,var(--color-secondary-text))]">
            <div className="flex flex-wrap items-center gap-3">
              <Zap className="h-6 w-6 fill-current" />
              <h2 className="font-display text-2xl font-bold">{title || sale.title}</h2>
              {viewAll && (
                <Link
                  href="/flash-sale"
                  className="text-sm font-medium underline underline-offset-4 opacity-90 hover:opacity-100 whitespace-nowrap"
                >
                  {t("view_all", "View All")} ({sale.products.length}) →
                </Link>
              )}
            </div>
            {subtitle && <p className="mt-1 text-sm opacity-85">{subtitle}</p>}
          </div>
          {countdown && sale.ends_at && (
            <div className="text-[var(--color-commerce-flash-sale-text,var(--color-secondary-text))]">
              <p className="text-xs uppercase tracking-widest opacity-80 mb-1">
                {t("ends_in", "Ends in")}
              </p>
              <Countdown endsAt={sale.ends_at} />
            </div>
          )}
        </div>

        {layout === "grid" ? (
          <ProductGrid products={products} currency={currency} list={list} />
        ) : (

        <ItemListTracker list={list} products={products}>
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
              {products.map((product) => (
                <SwiperSlide key={product.id} className="!h-auto">
                  <ProductCard product={product} currency={currency} showWishlist={false} />
                </SwiperSlide>
              ))}
              <SwiperSlide className="!h-auto">
                <Link
                  href="/flash-sale"
                  className="h-full min-h-48 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[var(--color-commerce-flash-sale-text,var(--color-secondary-text))]/50 hover:border-[var(--color-commerce-flash-sale-text,var(--color-secondary-text))] hover:bg-[var(--color-commerce-flash-sale-text,var(--color-secondary-text))]/10 text-[var(--color-commerce-flash-sale-text,var(--color-secondary-text))] text-sm font-medium transition-colors"
                >
                  <span className="h-12 w-12 rounded-full bg-[var(--color-commerce-flash-sale-text,var(--color-secondary-text))]/20 flex items-center justify-center">
                    <ArrowRight className="h-6 w-6" />
                  </span>
                  {t("view_all_deals", "View all deals")}
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
        )}

        {layout !== "grid" && (
          <div ref={setPaginationEl} className="deals-pagination mt-5 flex justify-center" />
        )}
      </div>
    </section>
  );
}
