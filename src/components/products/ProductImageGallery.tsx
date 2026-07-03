"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface GalleryImage {
  url: string;
  id?: number;
}

interface ProductImageGalleryProps {
  images: GalleryImage[];
  productName: string;
}

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  if (!activeImage) return null;

  return (
    <div className="lg:sticky lg:top-24">
      <div className="lg:grid lg:grid-cols-[66px_1fr] lg:gap-4 items-start">
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="order-2 lg:order-1 mt-3 lg:mt-0 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible lg:max-h-[42rem] lg:overflow-y-auto">
            {images.map((img, i) => (
              <button
                key={img.id ?? i}
                onClick={() => setActiveIndex(i)}
                aria-label={`View image ${i + 1}`}
                aria-pressed={i === activeIndex}
                className={cn(
                  "relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border transition-colors",
                  i === activeIndex
                    ? "border-brand-500"
                    : "border-[var(--color-border)] hover:border-brand-300"
                )}
              >
                <Image
                  src={img.url}
                  alt={`${productName} thumbnail ${i + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover object-top"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main image */}
        <div className="order-1 lg:order-2 relative w-full aspect-[4/5] lg:aspect-auto lg:h-[41rem] rounded-xl overflow-hidden border border-[var(--color-border)] bg-surface-50">
          <Image
            key={activeImage.url}
            src={activeImage.url}
            alt={`${productName} — image ${activeIndex + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 525px"
            className="object-cover object-top"
            priority
          />
        </div>
      </div>
    </div>
  );
}
