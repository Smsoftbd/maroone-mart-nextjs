import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Package, Star, Download } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invoice?: string; total?: string; points?: string; invoice_url?: string }>;
}

export default async function OrderConfirmationPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { invoice, total, points, invoice_url: invoiceUrl } = await searchParams;
  const t = await getServerT();

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="mb-6 flex justify-center">
        <div className="bg-green-100 rounded-full p-4">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
      </div>

      <h1 className="font-display text-3xl font-bold mb-2">
        {t("order_placed", "Order Placed!")}
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-8">
        {t("order_placed_desc", "Thank you for your order. We'll send you a confirmation shortly.")}
      </p>

      <div className="bg-surface-50 rounded-2xl p-6 text-left space-y-3 mb-8">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Package className="h-4 w-4" /> {t("order_id", "Order ID")}
          </span>
          <span className="font-mono font-medium">{invoice || `#${id}`}</span>
        </div>
        {total && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-secondary)]">{t("total_paid", "Total Paid")}</span>
            <span className="font-bold">{total}</span>
          </div>
        )}
        {points && Number(points) > 0 && (
          <div className="flex items-center justify-between text-brand-500">
            <span className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4" /> {t("points_earned", "Points Earned")}
            </span>
            <span className="font-bold">+{points} pts</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {invoiceUrl && (
          <a
            href={invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 font-body font-medium px-5 py-2.5 text-sm rounded-lg w-full text-center bg-brand-500 text-white hover:bg-brand-600 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Download className="h-4 w-4" /> {t("download_invoice", "Download Invoice")}
          </a>
        )}
        <Link
          href="/account/orders"
          className="inline-flex items-center justify-center gap-2 font-body font-medium px-5 py-2.5 text-sm rounded-lg w-full text-center bg-brand-500 text-white hover:bg-brand-600 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {t("view_my_orders", "View My Orders")}
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 font-body font-medium px-5 py-2.5 text-sm rounded-lg w-full text-center border border-surface-900 text-surface-900 hover:bg-surface-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {t("continue_shopping", "Continue Shopping")}
        </Link>
      </div>
    </div>
  );
}
