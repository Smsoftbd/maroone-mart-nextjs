"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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

const ZOOM_FACTOR = 3;

function ImageMagnifier({
  src,
  alt,
  size,
}: {
  src: string;
  alt: string;
  size: number;
}) {
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [aspectRatio, setAspectRatio] = useState(1);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAspectRatio(1);
  }, [src]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setZoom({
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    });
  }, []);

  const containerHeight = size * aspectRatio;

  return (
    <div className="relative" style={{ width: "100%" }}>
      <div
        ref={imgRef}
        className="relative rounded-xl overflow-hidden bg-surface-50 border border-[var(--color-border)] cursor-crosshair"
        style={{ width: "100%", height: containerHeight }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoom(null)}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`${size}px`}
          className="object-contain"
          priority
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            if (img.naturalWidth > 0) {
              setAspectRatio(img.naturalHeight / img.naturalWidth);
            }
          }}
        />
        {!zoom && (
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded-full pointer-events-none select-none">
            Hover to magnify
          </span>
        )}
      </div>

      {/* Zoom panel — absolute, right of image, same height */}
      {zoom && (
        <div
          className="absolute top-0 rounded-xl border border-[var(--color-border)] shadow-lg"
          style={{
            left: "calc(100% + 12px)",
            width: size,
            height: containerHeight,
            backgroundImage: `url(${src})`,
            backgroundSize: `${ZOOM_FACTOR * 100}%`,
            backgroundPosition: `${zoom.x * 100}% ${zoom.y * 100}%`,
            backgroundRepeat: "no-repeat",
            backgroundColor: "white",
            zIndex: 50,
          }}
        />
      )}
    </div>
  );
}

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(500);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeImage = images[activeIndex];

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  if (!activeImage) return null;

  const size = containerWidth || 500;

  return (
    <div className="flex flex-col gap-3" ref={containerRef}>
      <ImageMagnifier
        src={activeImage.url}
        alt={`${productName} — image ${activeIndex + 1}`}
        size={size}
      />

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
