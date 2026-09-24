import { FileText, MessageCircleQuestion, Phone, Star } from "lucide-react";
import { Rating } from "@/components/ui/Rating";
import { ReviewCard } from "./ReviewCard";
import { ProductInfoSections, type InfoPanel } from "./ProductInfoSections";
import { getServerT } from "@/lib/i18n/server";
import { splitPhones } from "@/lib/utils/phone";
import type { Product, Store, Review, Question } from "@/lib/api/types";

interface ProductDetailsSectionsProps {
  product: Product;
  store: Store;
  reviews: Review[];
  questions: Question[];
}

export async function ProductDetailsSections({
  product,
  store,
  reviews,
  questions,
}: ProductDetailsSectionsProps) {
  const t = await getServerT();
  const specs = product.specifications ?? [];
  const phones = splitPhones(store.phone);
  const showReviews = store.features?.reviews !== false;

  // Star distribution from loaded reviews; totals come from the product.
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const distTotal = Math.max(reviews.length, 1);

  const description = (
    <div className="space-y-6">
      {product.description ? (
        <div
          className="prose-content max-w-none text-sm leading-relaxed text-[var(--color-text-secondary)] [&_img]:rounded-lg [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:mx-auto"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">
          {t("no_description", "No description available.")}
        </p>
      )}

      {specs.length > 0 && (
        <dl className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)] overflow-hidden text-sm">
          {specs.map((spec, i) => (
            <div key={i} className="grid grid-cols-[minmax(8rem,35%)_1fr] gap-4 px-4 py-3 odd:bg-surface-50">
              <dt className="text-[var(--color-text-secondary)]">{spec.label}</dt>
              <dd className="font-medium text-[var(--color-text-primary)]">{spec.value}</dd>
            </div>
          ))}
        </dl>
      )}

    </div>
  );

  const contactPanel = (
    <div className="text-center">
      <p className="text-lg font-bold text-[var(--color-text-primary)]">
        {t("contact_for_details", "Want to know more?")}
      </p>
      <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-base">
        <span className="text-[var(--color-text-secondary)]">{t("call_us", "Call us")}:</span>
        {phones.map((p, i) => (
          <span key={p} className="inline-flex items-center gap-2">
            {i > 0 && <span className="text-[var(--color-text-secondary)]">{t("or", "or")}</span>}
            <a
              href={`tel:${p}`}
              className="inline-flex items-center gap-1 text-lg font-bold tabular-nums text-brand-ink"
            >
              <Phone className="h-[18px] w-[18px] fill-current" />
              {p}
            </a>
          </span>
        ))}
      </p>
    </div>
  );

  const reviewsPanel = (
    <div>
      <div className="grid gap-6 sm:grid-cols-[12rem_1fr] sm:items-center">
        <div className="text-center">
          <p className="text-3xl font-bold tabular-nums text-[var(--color-text-primary)]">
            {product.rating_avg.toFixed(1)}
          </p>
          <Rating value={product.rating_avg} size="md" className="mt-2 justify-center" />
          <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
            {product.rating_count} {t("ratings", "Ratings")}
          </p>
        </div>
        <ul className="space-y-1.5">
          {dist.map(({ star, count }) => (
            <li key={star} className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
              <span className="inline-flex w-6 items-center gap-0.5 tabular-nums">
                {star}
                <Star className="h-3 w-3 fill-[var(--color-commerce-rating-star,var(--color-tertiary-ink))] text-[var(--color-commerce-rating-star,var(--color-tertiary-ink))]" />
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-100">
                <span
                  className="block h-full rounded-full bg-[var(--color-commerce-rating-star,var(--color-tertiary-500))]"
                  style={{ width: `${(count / distTotal) * 100}%` }}
                />
              </span>
              <span className="w-6 text-right tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
      </div>
      {reviews.length > 0 && (
        <div className="mt-6 space-y-3">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </div>
  );

  const questionsPanel =
    questions.length === 0 ? (
      <p className="text-sm text-[var(--color-text-muted)]">{t("no_questions_yet", "No questions yet.")}</p>
    ) : (
      <ul className="space-y-3">
        {questions.map((q) => (
          <li key={q.id} className="rounded-lg border border-[var(--color-border)] p-4 text-sm">
            <p className="font-medium text-[var(--color-text-primary)]">
              <span className="mr-1.5 font-bold text-brand-ink">Q:</span>
              {q.question}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">— {q.customer_name}</p>
            {q.answer && (
              <p className="mt-3 border-t border-[var(--color-border)] pt-3 text-[var(--color-text-secondary)]">
                <span className="mr-1.5 font-bold text-secondary-ink">A:</span>
                {q.answer}
              </p>
            )}
          </li>
        ))}
      </ul>
    );

  const panels: InfoPanel[] = [
    {
      id: "product-description",
      label: t("description", "Description"),
      content: description,
      icon: <FileText className="h-4 w-4" />,
      tone: "#4F46E5",
    },
    ...(showReviews
      ? [
          {
            id: "product-reviews",
            label: `${t("ratings_reviews", "Ratings & Reviews")} (${product.rating_count})`,
            content: reviewsPanel,
            icon: <Star className="h-4 w-4 fill-current" />,
            tone: "#F59E0B",
          },
        ]
      : []),
    ...(phones.length > 0
      ? [
          {
            id: "product-contact",
            label: t("contact_us", "Contact Us"),
            content: contactPanel,
            icon: <Phone className="h-4 w-4" />,
            tone: "#16A34A",
          },
        ]
      : []),
    {
      id: "product-questions",
      label: t("questions_answers", "Q&A"),
      content: questionsPanel,
      icon: <MessageCircleQuestion className="h-4 w-4" />,
      tone: "#EA580C",
    },
  ];

  return <ProductInfoSections panels={panels} />;
}
