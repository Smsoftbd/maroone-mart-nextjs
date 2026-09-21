"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { getVideoEmbedSrc, getTweetUrl } from "@/lib/utils/video";

const ZOOM = 2.2;

interface GalleryImage {
  url: string; // thumbnail / poster for video items
  id?: number;
  kind?: "image" | "video";
  provider?: string;
  videoId?: string;
}

interface ProductImageGalleryProps {
  images: GalleryImage[];
  productName: string;
}

declare global {
  interface Window {
    twttr?: { widgets?: { load?: (el?: HTMLElement | null) => void } };
  }
}

function TwitterEmbed({ videoId }: { videoId: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => window.twttr?.widgets?.load?.(ref.current);
    if (window.twttr?.widgets) {
      load();
      return;
    }
    const existing = document.getElementById("twitter-wjs") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", load);
      return () => existing.removeEventListener("load", load);
    }
    const s = document.createElement("script");
    s.id = "twitter-wjs";
    s.src = "https://platform.twitter.com/widgets.js";
    s.async = true;
    s.addEventListener("load", load);
    document.body.appendChild(s);
  }, [videoId]);

  return (
    <div ref={ref} className="h-full w-full overflow-y-auto p-2">
      <blockquote className="twitter-tweet" data-conversation="none">
        <a href={getTweetUrl(videoId)}>{getTweetUrl(videoId)}</a>
      </blockquote>
    </div>
  );
}

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const activeImage = images[activeIndex];
  const isVideo = activeImage?.kind === "video";

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = mainRef.current?.getBoundingClientRect();
    if (!rect) return;
    setOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  if (!activeImage) return null;

  const embedSrc =
    isVideo && activeImage.provider
      ? getVideoEmbedSrc(activeImage.provider, activeImage.videoId ?? "")
      : null;

  return (
    <div className="lg:sticky lg:top-24">
      <div
        className={cn(
          "flex flex-col items-start",
          images.length > 1 && "lg:grid lg:grid-cols-[66px_1fr] lg:gap-4"
        )}
      >
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="order-2 lg:order-1 mt-3 lg:mt-0 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible lg:max-h-[42rem] lg:overflow-y-auto">
            {images.map((img, i) => (
              <button
                key={img.id ?? i}
                onClick={() => setActiveIndex(i)}
                aria-label={img.kind === "video" ? "Play video" : `View image ${i + 1}`}
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
                {img.kind === "video" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 pl-0.5 text-[10px] text-black">
                      ▶
                    </span>
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Main area — image (hover to zoom) or video embed */}
        {isVideo ? (
          <div className="order-1 lg:order-2 relative w-full aspect-[4/5] lg:aspect-auto lg:h-[41rem] rounded-xl overflow-hidden border border-[var(--color-border)] bg-black">
            {activeImage.provider === "twitter" ? (
              <TwitterEmbed videoId={activeImage.videoId ?? ""} />
            ) : embedSrc ? (
              <iframe
                src={embedSrc}
                title={`${productName} video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            ) : null}
          </div>
        ) : (
          <div
            ref={mainRef}
            onMouseMove={handleMove}
            onMouseLeave={() => setOrigin(null)}
            className="group order-1 lg:order-2 relative w-full aspect-[4/5] lg:aspect-auto lg:h-[41rem] rounded-xl overflow-hidden border border-[var(--color-border)] bg-surface-50 cursor-zoom-in"
          >
            <Image
              key={activeImage.url}
              src={activeImage.url}
              alt={`${productName} — image ${activeIndex + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 525px"
              className="object-cover object-top transition-transform duration-200 ease-out"
              style={{
                transform: origin ? `scale(${ZOOM})` : "scale(1)",
                transformOrigin: origin ? `${origin.x}% ${origin.y}%` : "center",
              }}
              priority
            />
            {!origin && (
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-slate-600 bg-white/80 px-2 py-1 rounded-full pointer-events-none select-none lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                Hover to zoom
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
