"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { Countdown } from "@/components/ui/Countdown";
import { ProductCard } from "@/components/products/ProductCard";
import type { FlashSale } from "@/lib/api/types";

interface FlashSaleBannerProps {
  sales: FlashSale[];
  currency: string;
}

export function FlashSaleBanner({ sales, currency }: FlashSaleBannerProps) {
  const sale = sales[0];
  if (!sale) return null;

  return (
    <section className="bg-brand-500 py-8 my-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 text-white">
            <Zap className="h-6 w-6 fill-current" />
            <h2 className="font-display text-2xl font-bold">{sale.title}</h2>
          </div>
          <div className="text-white">
            <p className="text-xs uppercase tracking-widest opacity-80 mb-1">
              Ends in
            </p>
            <Countdown endsAt={sale.ends_at} />
          </div>
        </div>

        {/* Product rail */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {sale.products.map((product) => (
            // White panel keeps the chrome-less minimal card legible on the brand ground
            <div key={product.id} className="shrink-0 w-48 bg-white p-3">
              <ProductCard
                product={product}
                currency={currency}
                showWishlist={false}
                variant="minimal"
              />
            </div>
          ))}
          <div className="shrink-0 flex items-center px-4">
            <Link
              href="/products"
              className="text-white border-2 border-white/50 hover:border-white px-6 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
            >
              View All →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
