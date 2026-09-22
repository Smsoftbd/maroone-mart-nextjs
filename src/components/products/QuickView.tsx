"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { useCart } from "@/lib/hooks/useCart";
import { useT } from "@/lib/i18n/I18nProvider";
import { formatPrice } from "@/lib/utils/format";
import type { Product } from "@/lib/api/types";

interface QuickViewProps {
  product: Product;
  currency: string;
  open: boolean;
  onClose: () => void;
}

/** Product summary in a modal (product.quick_view). Variants are picked on the product page. */
export function QuickView({ product, currency, open, onClose }: QuickViewProps) {
  const t = useT();
  const router = useRouter();
  const { addItem, isLoading } = useCart();
  const barcode = product.barcodes.find((b) => b.is_active) ?? product.barcodes[0];
  const price = Math.max(barcode?.effective_price ?? 0, 0);
  const original = barcode?.price ?? 0;
  const inStock = product.barcodes.some((b) => b.stock > 0) || (product.stock_qty ?? 0) > 0;
  const href = `/products/${product.slug}`;
  const needsOptions = product.type === "variable";

  const add = async (buy: boolean) => {
    if (!barcode) return;
    await addItem(barcode.id, 1, product.name, price, barcode.stock, undefined, { openDrawer: !buy });
    onClose();
    if (buy) router.push("/checkout");
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={product.name} className="max-w-3xl">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="store-card-img relative aspect-product overflow-hidden">
          <Image src={product.image} alt={product.name} fill sizes="(min-width: 640px) 360px, 90vw" className="card-img-main" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className={`price text-2xl ${original > price ? "is-sale" : ""}`}>{formatPrice(price, currency)}</span>
            {original > price && <s className="price-old text-sm">{formatPrice(original, currency)}</s>}
          </div>
          {product.short_description && (
            <div
              className="prose-content text-sm text-[var(--color-text-secondary)] [&_p:last-child]:mb-0"
              dangerouslySetInnerHTML={{ __html: product.short_description }}
            />
          )}
          <div className="mt-auto grid gap-2">
            {needsOptions ? (
              <Link href={href} onClick={onClose} className="btn btn-primary text-center">
                {t("select_options", "Select options")}
              </Link>
            ) : (
              <>
                <button onClick={() => add(false)} disabled={isLoading || !inStock} className="btn btn-cart">
                  {inStock ? t("add_to_cart", "Add to Cart") : t("out_of_stock", "Out of Stock")}
                </button>
                <button onClick={() => add(true)} disabled={isLoading || !inStock} className="btn btn-buy">
                  {t("buy_now", "Buy Now")}
                </button>
              </>
            )}
            <Link href={href} onClick={onClose} className="text-center text-sm">
              {t("view_details", "View details")}
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
