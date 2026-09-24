import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RatingProps {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}

export function Rating({ value, count, size = "sm", className }: RatingProps) {
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`Rating: ${value} out of 5${count !== undefined ? `, ${count} reviews` : ""}`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            starSize,
            star <= Math.floor(value)
              ? "fill-current text-[var(--color-tertiary-ink)]"
              : star - 0.5 <= value
              ? "fill-[var(--color-tertiary-ink)]/40 text-[var(--color-tertiary-ink)]"
              : "fill-none text-[var(--color-commerce-rating-star-empty,var(--color-border-dark))]"
          )}
        />
      ))}
      {count !== undefined && (
        <span className="ml-1 text-xs text-[var(--color-text-muted)]">
          ({count})
        </span>
      )}
    </div>
  );
}
