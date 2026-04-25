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
              ? "fill-yellow-400 text-yellow-400"
              : star - 0.5 <= value
              ? "fill-yellow-200 text-yellow-400"
              : "fill-transparent text-yellow-300"
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
