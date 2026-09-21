"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard, type ProductCardVariant } from "./ProductCard";
import { ItemListTracker } from "@/components/analytics/ItemListTracker";
import type { ItemList } from "@/lib/analytics/track";
import type { Product } from "@/lib/api/types";

import "swiper/css";
import "swiper/css/navigation";

interface ProductCarouselProps {
  products: Product[];
  currency: string;
  variant?: ProductCardVariant;
  /** GA4 list for view_item_list / select_item. */
  list?: ItemList;
}

export function ProductCarousel({
  products,
  currency,
  variant = "default",
  list,
}: ProductCarouselProps) {
  const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null);

  if (!products.length) return null;

  const carousel = (
    <div
      className={
        variant === "minimal" ? "" : "sm:shadow-lg sm:bg-white rounded-xl sm:p-6"
      }
    >
      <div className="relative">
        <Swiper
          modules={[Navigation]}
          spaceBetween={20}
          grabCursor
          watchOverflow
          breakpoints={{
            0: { slidesPerView: 2.15 },
            640: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
          navigation={{ prevEl, nextEl }}
          className="product-carousel !py-1"
        >
          {products.map((product) => (
            <SwiperSlide key={product.id} className="!h-auto">
              <ProductCard product={product} currency={currency} variant={variant} />
            </SwiperSlide>
          ))}
        </Swiper>

        <button
          ref={setPrevEl}
          aria-label="Previous products"
          className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white shadow-md border border-slate-200 text-slate-700 transition-opacity hover:opacity-80 disabled:opacity-0"
        >
          <ChevronLeft height={20} width={20} />
        </button>
        <button
          ref={setNextEl}
          aria-label="Next products"
          className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white shadow-md border border-slate-200 text-slate-700 transition-opacity hover:opacity-80 disabled:opacity-0"
        >
          <ChevronRight height={20} width={20} />
        </button>
      </div>
    </div>
  );

  return list ? (
    <ItemListTracker list={list} products={products}>
      {carousel}
    </ItemListTracker>
  ) : (
    carousel
  );
}
