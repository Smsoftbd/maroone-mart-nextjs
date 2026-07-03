"use client";

export function ScrollToTop() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      className="fixed right-5 bottom-5 z-40 inline-flex h-[43px] w-[43px] items-center justify-center rounded-full bg-brand-500 text-[var(--color-primary-text)] shadow-lg transition-transform hover:-translate-y-0.5"
    >
      <svg viewBox="0 0 24 24" height="20" width="20" fill="currentColor">
        <path d="M6 4h12v2H6zm.707 11.707L11 11.414V20h2v-8.586l4.293 4.293 1.414-1.414L12 7.586l-6.707 6.707z" />
      </svg>
    </button>
  );
}
