/**
 * Maps a product's video_provider + video_id (bare id or full URL) to an
 * embeddable iframe src. Returns null when the provider has no id-only iframe
 * (twitter) or is unknown — callers handle those cases separately.
 */
export function getVideoEmbedSrc(provider: string, v: string): string | null {
  const id = v.trim();
  if (!id) return null;
  switch (provider) {
    case "youtube": {
      const m = id.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
      return `https://www.youtube.com/embed/${m ? m[1] : id}`;
    }
    case "vimeo": {
      const m = id.match(/vimeo\.com\/(\d+)/);
      return `https://player.vimeo.com/video/${m ? m[1] : id}`;
    }
    case "facebook":
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(id)}&show_text=false`;
    case "twitter":
      return null; // no id-only iframe — rendered via X embed
    default:
      return null;
  }
}

/** URL to the tweet/X post, for the platform embed fallback. */
export function getTweetUrl(v: string): string {
  const id = v.trim();
  return /^https?:\/\//.test(id) ? id : `https://twitter.com/i/status/${id}`;
}
