import { MessageCircleQuestion, Phone, Star } from "lucide-react";
import { Rating } from "@/components/ui/Rating";
import { ReviewCard } from "./ReviewCard";
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

  const nav = [
    { id: "product-description", label: t("product_description", "Product Description") },
    showReviews && { id: "product-reviews", label: t("ratings_reviews", "Ratings & Reviews") },
    { id: "product-questions", label: t("questions_answers", "Q&A") },
  ].filter((x): x is { id: string; label: string } => Boolean(x));

  // Star distribution from loaded reviews; totals come from the product.
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const distTotal = Math.max(reviews.length, 1);

  const heading = "text-base font-semibold text-[var(--color-text-primary)]";

  return (
    <section className="mt-6">
      {/* Section nav */}
      <nav className="sticky top-[3.25rem] lg:top-[7.5rem] z-10 bg-[var(--color-surface-0)] border-b border-[var(--color-border)]">
        <ul className="grid grid-flow-col auto-cols-fr overflow-x-auto scrollbar-none">
          {nav.map((n) => (
            <li key={n.id}>
              <a
                href={`#${n.id}`}
                className="block whitespace-nowrap px-3 py-3 text-center text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] border-b-2 border-transparent -mb-px hover:text-brand-500 hover:border-brand-500 transition-colors"
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 space-y-10">
        {/* Description + specs */}
        <div id="product-description" className="scroll-mt-32 lg:scroll-mt-48 space-y-6">
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

          {/* Contact box */}
          {phones.length > 0 && (
            <div className="rounded-lg border border-brand-500/40 bg-surface-50 px-4 py-5 text-center">
              <p className="font-semibold text-[var(--color-text-primary)]">
                {t("contact_for_details", "Want to know more?")}
              </p>
              <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm">
                <span className="text-[var(--color-text-secondary)]">{t("call_us", "Call us")}:</span>
                {phones.map((p, i) => (
                  <span key={p} className="inline-flex items-center gap-2">
                    {i > 0 && <span className="text-[var(--color-text-secondary)]">{t("or", "or")}</span>}
                    <a
                      href={`tel:${p}`}
                      className="inline-flex items-center gap-1 font-semibold text-brand-500 hover:text-brand-600 tabular-nums"
                    >
                      <Phone className="h-3.5 w-3.5 fill-current" />
                      {p}
                    </a>
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>

        {/* Ratings & reviews */}
        {showReviews && (
          <div id="product-reviews" className="scroll-mt-32 lg:scroll-mt-48">
            <h2 className={heading}>{t("ratings_reviews", "Ratings & Reviews")}:</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-[12rem_1fr] sm:items-center">
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
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-100">
                      <span
                        className="block h-full rounded-full bg-amber-400"
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
        )}

        {/* Q&A */}
        <div id="product-questions" className="scroll-mt-32 lg:scroll-mt-48 border-t border-[var(--color-border)] pt-6">
          <h2 className={`${heading} flex items-center gap-2`}>
            <MessageCircleQuestion className="h-5 w-5 text-[var(--color-text-secondary)]" strokeWidth={1.75} />
            {t("questions_about_product", "Questions about this product")} ({questions.length})
          </h2>
          {questions.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              {t("no_questions_yet", "No questions yet.")}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {questions.map((q) => (
                <li key={q.id} className="rounded-lg border border-[var(--color-border)] p-4 text-sm">
                  <p className="font-medium text-[var(--color-text-primary)]">
                    <span className="mr-1.5 font-bold text-brand-500">Q:</span>
                    {q.question}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">— {q.customer_name}</p>
                  {q.answer && (
                    <p className="mt-3 border-t border-[var(--color-border)] pt-3 text-[var(--color-text-secondary)]">
                      <span className="mr-1.5 font-bold text-[#12b3c7]">A:</span>
                      {q.answer}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
