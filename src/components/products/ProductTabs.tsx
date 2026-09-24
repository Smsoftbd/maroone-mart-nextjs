"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { ReviewCard } from "./ReviewCard";
import type { Product, Review, Question } from "@/lib/api/types";

interface ProductTabsProps {
  product: Product;
  reviews: Review[];
  questions: Question[];
}

type Tab = "description" | "reviews" | "questions" | "specs";

export function ProductTabs({ product, reviews, questions }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("description");

  const tabs = [
    { id: "description" as Tab, label: "Description" },
    { id: "specs" as Tab, label: "Specifications", hidden: (product.specifications ?? []).length === 0 },
    { id: "reviews" as Tab, label: `Reviews (${reviews.length})` },
    { id: "questions" as Tab, label: `Q&A (${questions.length})` },
  ].filter((t) => !t.hidden);

  return (
    <div className="mt-12">
      {/* Tab headers */}
      <div className="border-b border-[var(--color-border)] mb-6">
        <div className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
                activeTab === tab.id
                  ? "border-brand-500 text-brand-ink"
                  : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "description" && (
        <div
          className="prose-content text-sm text-[var(--color-text-secondary)] max-w-none leading-relaxed"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      )}

      {activeTab === "specs" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-[var(--color-border)]">
              {(product.specifications ?? []).map((spec, i) => (
                <tr key={i}>
                  <td className="py-3 pr-6 font-medium text-[var(--color-text-secondary)] w-40">
                    {spec.label}
                  </td>
                  <td className="py-3">{spec.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              No reviews yet.
            </p>
          ) : (
            reviews.map((r) => <ReviewCard key={r.id} review={r} />)
          )}
        </div>
      )}

      {activeTab === "questions" && (
        <div className="space-y-4">
          {questions.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              No questions yet.
            </p>
          ) : (
            questions.map((q) => (
              <div
                key={q.id}
                className="border border-[var(--color-border)] rounded-xl p-4"
              >
                <p className="font-medium text-sm mb-1">Q: {q.question}</p>
                <p className="text-sm font-medium text-[var(--color-text-muted)]">
                  — {q.customer_name}
                </p>
                {q.answer && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      A: {q.answer}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
