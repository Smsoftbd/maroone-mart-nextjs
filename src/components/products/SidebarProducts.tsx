"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/api/types";

import "swiper/css";
import "swiper/css/pagination";

interface SidebarProductsProps {
  title: string;
  products: Product[];
  currency: string;
}

/**
 * Shop sidebar "Featured products": one card at a time with arrows beside
 * the photo, a wide add-to-cart button and dots underneath.
 */
export function SidebarProducts({ title, products, currency }: SidebarProductsProps) {
  const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null);
  const [dotsEl, setDotsEl] = useState<HTMLDivElement | null>(null);

  if (!products.length) return null;

  return (
    <section className="shop-widget">
      <h3 className="shop-widget-title">
        <span>{title}</span>
      </h3>
      <div className="shop-widget-products relative">
        <Swiper
          modules={[Navigation, Pagination]}
          slidesPerView={1}
          loop={products.length > 1}
          navigation={{ prevEl, nextEl }}
          pagination={{ el: dotsEl, clickable: true }}
        >
          {products.map((p) => (
            <SwiperSlide key={p.id}>
              <ProductCard product={p} currency={currency} button />
            </SwiperSlide>
          ))}
        </Swiper>
        <button ref={setPrevEl} className="shop-widget-arrow is-prev" aria-label="Previous product">
          <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
        </button>
        <button ref={setNextEl} className="shop-widget-arrow is-next" aria-label="Next product">
          <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
        </button>
        <div ref={setDotsEl} className="shop-widget-dots" />
      </div>
    </section>
  );
}
