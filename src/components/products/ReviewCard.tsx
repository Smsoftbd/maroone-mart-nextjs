import { Rating } from "@/components/ui/Rating";
import { formatDate } from "@/lib/utils/format";
import type { Review } from "@/lib/api/types";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border border-[var(--color-border)] rounded-xl p-4">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <p className="font-medium text-sm">{review.customer_name}</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {formatDate(review.created_at)}
          </p>
        </div>
        <Rating value={review.rating} />
      </div>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
        {review.review}
      </p>
    </div>
  );
}
