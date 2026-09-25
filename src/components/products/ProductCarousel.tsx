"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard, type ProductCardVariant } from "./ProductCard";
import { useTheme } from "@/components/providers/StoreConfigProvider";
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
  /** Slides per view from `xl` up; defaults to layout.products_per_row. */
  columns?: number;
  /** "top": the arrows sit together above the rail's right end (related products). */
  arrows?: "sides" | "top";
}

export function ProductCarousel({
  products,
  currency,
  variant = "default",
  list,
  columns,
  arrows = "sides",
}: ProductCarouselProps) {
  const { layout } = useTheme();
  const perRow = columns ?? layout.products_per_row;
  const mobile = layout.mobile_columns === 1 ? 1.15 : 1.9;
  const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null);

  if (!products.length) return null;

  const carousel = (
    <div>
      <div className={arrows === "top" ? "relative carousel-top-arrows" : "relative"}>
        <Swiper
          modules={[Navigation]}
          spaceBetween={layout.grid_gap}
          grabCursor
          watchOverflow
          breakpoints={{
            0: { slidesPerView: mobile, spaceBetween: 14 },
            640: { slidesPerView: Math.min(3, perRow), spaceBetween: layout.grid_gap },
            1024: { slidesPerView: Math.min(4, perRow) },
            1280: { slidesPerView: perRow },
          }}
          navigation={{ prevEl, nextEl }}
          className="product-carousel py-1"
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
          className="carousel-arrow is-prev"
        >
          <ChevronLeft height={34} width={34} strokeWidth={1} />
        </button>
        <button
          ref={setNextEl}
          aria-label="Next products"
          className="carousel-arrow is-next"
        >
          <ChevronRight height={34} width={34} strokeWidth={1} />
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
