"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getVideoEmbedSrc, getTweetUrl } from "@/lib/utils/video";

const ZOOM = 2.2;
const SWIPE_THRESHOLD = 40;

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
  const touchX = useRef<number | null>(null);
  const activeImage = images[activeIndex];
  const isVideo = activeImage?.kind === "video";
  const count = images.length;

  const go = useCallback(
    (dir: 1 | -1) => {
      setOrigin(null);
      setActiveIndex((i) => (i + dir + count) % count);
    },
    [count]
  );

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Zoom only for fine pointers — on touch it fights with swiping.
    if (!window.matchMedia("(hover: hover)").matches) return;
    const rect = mainRef.current?.getBoundingClientRect();
    if (!rect) return;
    setOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null || count < 2) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (count < 2) return;
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  };

  if (!activeImage) return null;

  const embedSrc =
    isVideo && activeImage.provider
      ? getVideoEmbedSrc(activeImage.provider, activeImage.videoId ?? "")
      : null;

  const frame =
    "relative w-full aspect-[4/5] lg:aspect-auto lg:h-[min(40rem,calc(100vh-10rem))] rounded-2xl overflow-hidden bg-surface-100";

  return (
    <div className="lg:sticky lg:top-32">
      <div
        className={cn(
          "flex flex-col",
          count > 1 && "lg:grid lg:grid-cols-[72px_1fr] lg:gap-4"
        )}
      >
        {/* Thumbnails */}
        {count > 1 && (
          <div className="order-2 lg:order-1 mt-3 lg:mt-0 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible lg:max-h-[min(40rem,calc(100vh-10rem))] lg:overflow-y-auto scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0">
            {images.map((img, i) => (
              <button
                key={img.id ?? i}
                onClick={() => {
                  setOrigin(null);
                  setActiveIndex(i);
                }}
                aria-label={img.kind === "video" ? "Play video" : `View image ${i + 1}`}
                aria-pressed={i === activeIndex}
                className={cn(
                  "relative shrink-0 w-16 h-20 lg:w-[72px] lg:h-[90px] rounded-lg overflow-hidden bg-surface-100 transition-all",
                  i === activeIndex
                    ? "ring-2 ring-[var(--color-text-primary)] ring-offset-2 ring-offset-[var(--color-surface-0)]"
                    : "opacity-60 hover:opacity-100"
                )}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="72px"
                  className="object-cover object-top"
                />
                {img.kind === "video" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-black">
                      <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                    </span>
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Main area — image (hover to zoom) or video embed */}
        <div
          className="order-1 lg:order-2 relative group/main"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onKeyDown={onKeyDown}
          tabIndex={count > 1 ? 0 : undefined}
          aria-roledescription="carousel"
          aria-label={`${productName} images`}
        >
          {isVideo ? (
            <div className={cn(frame, "bg-black")}>
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
              className={cn(frame, "lg:cursor-zoom-in")}
            >
              <Image
                key={activeImage.url}
                src={activeImage.url}
                alt={`${productName} — image ${activeIndex + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 640px"
                className="object-cover object-top transition-transform duration-200 ease-out animate-[fadeIn_.25s_ease-out]"
                style={{
                  transform: origin ? `scale(${ZOOM})` : "scale(1)",
                  transformOrigin: origin ? `${origin.x}% ${origin.y}%` : "center",
                }}
                priority
              />
            </div>
          )}

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 backdrop-blur text-slate-800 shadow-sm transition-opacity lg:opacity-0 lg:group-hover/main:opacity-100 hover:bg-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next image"
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 backdrop-blur text-slate-800 shadow-sm transition-opacity lg:opacity-0 lg:group-hover/main:opacity-100 hover:bg-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white tabular-nums pointer-events-none">
                {activeIndex + 1} / {count}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
