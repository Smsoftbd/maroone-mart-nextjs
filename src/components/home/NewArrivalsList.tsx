"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { ItemListTracker } from "@/components/analytics/ItemListTracker";
import { SectionHeader } from "./SectionHeader";
import { useT } from "@/lib/i18n/I18nProvider";
import type { Product } from "@/lib/api/types";

import "swiper/css";
import "swiper/css/navigation";

interface NewArrivalsListProps {
  products: Product[];
  currency: string;
}

const navBtn =
  "hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-slate-50 shadow text-slate-700 transition-opacity hover:opacity-80 disabled:opacity-0";

/** Horizontal cards, two per column, paged sideways. */
export function NewArrivalsList({ products, currency }: NewArrivalsListProps) {
  const t = useT();
  const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null);

  if (!products.length) return null;

  const columns: Product[][] = [];
  for (let i = 0; i < products.length; i += 2) columns.push(products.slice(i, i + 2));

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SectionHeader
        title={t("new_arrivals", "New Arrivals")}
        viewAllHref="/products?sort=new"
        viewAllLabel={t("view_all", "View All")}
      />

      <ItemListTracker list={{ id: "new_arrivals", name: "New arrivals" }} products={products}>
        <div className="relative">
          <Swiper
            modules={[Navigation]}
            spaceBetween={16}
            grabCursor
            watchOverflow
            navigation={{ prevEl, nextEl }}
            breakpoints={{
              0: { slidesPerView: 1.1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {columns.map((pair) => (
              <SwiperSlide key={pair[0].id} className="!h-auto">
                <div className="flex h-full flex-col gap-4">
                  {pair.map((product) => (
                    <ProductCard key={product.id} product={product} currency={currency} variant="compact" />
                  ))}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <button ref={setPrevEl} aria-label="Previous products" className={`${navBtn} -left-5`}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button ref={setNextEl} aria-label="Next products" className={`${navBtn} -right-5`}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </ItemListTracker>
    </section>
  );
}
