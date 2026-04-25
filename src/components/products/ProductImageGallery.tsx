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
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-50 border border-[var(--color-border)]">
        <Image
          src={activeImage.url}
          alt={`${productName} — image ${activeIndex + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain transition-transform duration-300 hover:scale-105"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id ?? i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors",
                i === activeIndex
                  ? "border-brand-500"
                  : "border-[var(--color-border)] hover:border-brand-300"
              )}
              aria-label={`View image ${i + 1}`}
              aria-pressed={i === activeIndex}
            >
              <Image
                src={img.url}
                alt={`${productName} thumbnail ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
