import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Package, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invoice?: string; total?: string; points?: string }>;
}

export default async function OrderConfirmationPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { invoice, total, points } = await searchParams;

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="mb-6 flex justify-center">
        <div className="bg-green-100 rounded-full p-4">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
      </div>

      <h1 className="font-display text-3xl font-bold mb-2">
        Order Placed!
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-8">
        Thank you for your order. We&apos;ll send you a confirmation shortly.
      </p>

      <div className="bg-surface-50 rounded-2xl p-6 text-left space-y-3 mb-8">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Package className="h-4 w-4" /> Order ID
          </span>
          <span className="font-mono font-medium">{invoice || `#${id}`}</span>
        </div>
        {total && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-secondary)]">Total Paid</span>
            <span className="font-bold">{total}</span>
          </div>
        )}
        {points && Number(points) > 0 && (
          <div className="flex items-center justify-between text-brand-500">
            <span className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4" /> Points Earned
            </span>
            <span className="font-bold">+{points} pts</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/account/orders"
          className="inline-flex items-center justify-center gap-2 font-body font-medium px-5 py-2.5 text-sm rounded-lg w-full text-center bg-brand-500 text-white hover:bg-brand-600 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          View My Orders
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 font-body font-medium px-5 py-2.5 text-sm rounded-lg w-full text-center border border-surface-900 text-surface-900 hover:bg-surface-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
