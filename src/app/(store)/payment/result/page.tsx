import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";
import { DeferredPurchase } from "@/components/analytics/DeferredPurchase";

export const metadata: Metadata = {
  title: "Payment Result",
  robots: { index: false },
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    order_id?: string;
    tran_id?: string;
  }>;
}

export default async function PaymentResultPage({ searchParams }: PageProps) {
  const { status, order_id, tran_id } = await searchParams;
  const t = await getServerT();

  const isSuccess = status === "success";
  const isCancelled = status === "cancelled";

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      {isSuccess && order_id && <DeferredPurchase orderId={order_id} />}
      <div className="mb-6 flex justify-center">
        {isSuccess ? (
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        ) : isCancelled ? (
          <div className="bg-yellow-100 rounded-full p-4">
            <AlertCircle className="h-12 w-12 text-yellow-600" />
          </div>
        ) : (
          <div className="bg-red-100 rounded-full p-4">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
        )}
      </div>

      <h1 className="font-display text-3xl font-bold mb-2">
        {isSuccess ? t("payment_successful", "Payment Successful") : isCancelled ? t("payment_cancelled", "Payment Cancelled") : t("payment_failed", "Payment Failed")}
      </h1>

      <p className="text-[var(--color-text-secondary)] mb-8">
        {isSuccess
          ? t("payment_success_desc", "Your order has been confirmed and will be processed shortly.")
          : isCancelled
          ? t("payment_cancel_desc", "You cancelled the payment. Your order has not been charged.")
          : t("payment_fail_desc", "Something went wrong during payment. Please try again or choose a different method.")}
      </p>

      {(order_id || tran_id) && (
        <div className="bg-surface-50 rounded-2xl p-6 text-left space-y-3 mb-8">
          {order_id && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">{t("order_id", "Order ID")}</span>
              <span className="font-mono font-medium">#{order_id}</span>
            </div>
          )}
          {tran_id && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">{t("transaction_id", "Transaction ID")}</span>
              <span className="font-mono font-medium">{tran_id}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {isSuccess ? (
          <>
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
          </>
        ) : (
          <>
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center gap-2 font-body font-medium px-5 py-2.5 text-sm rounded-lg w-full text-center bg-brand-500 text-white hover:bg-brand-600 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {isCancelled ? t("return_to_checkout", "Return to Checkout") : t("try_again", "Try Again")}
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 font-body font-medium px-5 py-2.5 text-sm rounded-lg w-full text-center border border-surface-900 text-surface-900 hover:bg-surface-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {t("continue_shopping", "Continue Shopping")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
