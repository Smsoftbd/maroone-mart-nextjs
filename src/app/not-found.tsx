import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="font-display text-8xl font-bold text-brand-ink mb-4">404</h1>
      <h2 className="font-display text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-[var(--color-text-secondary)] mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 font-body font-medium px-5 py-2.5 text-sm rounded-lg bg-brand-500 text-[var(--color-primary-text)] hover:bg-brand-600 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          Go Home
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 font-body font-medium px-5 py-2.5 text-sm rounded-lg border border-surface-900 text-surface-900 hover:bg-surface-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          Browse Products
        </Link>
      </div>
    </div>
  );
}
