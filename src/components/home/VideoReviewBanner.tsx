import { ArrowRight, PlayCircle } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";

interface VideoReviewBannerProps {
  youtubeUrl: string;
}

export async function VideoReviewBanner({ youtubeUrl }: VideoReviewBannerProps) {
  const t = await getServerT();

  return (
    <section className="relative my-[var(--section-space,2rem)] overflow-hidden bg-secondary-500" data-reveal>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[var(--color-secondary-text)]/10 to-transparent" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-14 text-center text-[var(--color-secondary-text)] md:py-20">
        <h2 className="text-2xl font-bold leading-snug md:text-4xl">
          {t("video_reviews_title", "Watch review videos of our latest products")}
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--color-secondary-text)]/80 md:text-base">
          {t(
            "video_reviews_subtitle",
            "You'll also find reviews of all our products on our official YouTube channel"
          )}
        </p>
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-[var(--color-primary-text)] shadow-lg transition-colors hover:bg-brand-600"
        >
          <PlayCircle className="h-4 w-4" />
          {t("watch_video", "Watch Video")}
        </a>
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 text-xs font-medium text-[var(--color-secondary-text)]/80 underline-offset-4 hover:underline"
        >
          {t("visit_youtube_channel", "Visit our YouTube channel")}
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </section>
  );
}
