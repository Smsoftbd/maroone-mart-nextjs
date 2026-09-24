import Link from "next/link";
import { PackageX } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";

export default async function ProductNotFound() {
  const t = await getServerT();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <PackageX className="h-16 w-16 text-[var(--color-text-muted)] mx-auto mb-6" />
      <h1 className="font-display text-3xl font-bold mb-3">{t("product_not_found", "Product Not Found")}</h1>
      <p className="text-[var(--color-text-secondary)] mb-8 max-w-sm mx-auto">
        {t("product_not_found_desc", "This product may have been removed or the URL is incorrect.")}
      </p>
      <div className="flex gap-3 justify-center">
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 font-body font-medium px-5 py-2.5 text-sm rounded-lg bg-brand-500 text-[var(--color-primary-text)] hover:bg-brand-600 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {t("browse_products", "Browse Products")}
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 font-body font-medium px-5 py-2.5 text-sm rounded-lg border border-surface-900 text-surface-900 hover:bg-surface-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {t("go_home", "Go Home")}
        </Link>
      </div>
    </div>
  );
}
