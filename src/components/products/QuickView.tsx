"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Flame, Heart, Minus, Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductImageGallery } from "./ProductImageGallery";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { useCart } from "@/lib/hooks/useCart";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { useT } from "@/lib/i18n/I18nProvider";
import { useStoreConfig } from "@/components/providers/StoreConfigProvider";
import { formatPrice, formatDiscount } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { loadQuickViewProduct } from "@/app/(store)/products/actions";
import type { Barcode, Product } from "@/lib/api/types";

interface QuickViewProps {
  product: Product;
  currency: string;
  open: boolean;
  onClose: () => void;
}

const defaultBarcode = (p: Product) => p.barcodes.find((b) => b.is_active) ?? p.barcodes[0];

/**
 * Product quick view (product.quick_view): gallery on the left; title, brand /
 * code / availability, price, short description, option pills, quantity,
 * subtotal and Add to cart (+ wishlist) on the right. The card's list data
 * renders at once; the full product (images, options, description) is fetched
 * on open because the list endpoint leaves those out.
 */
export function QuickView({ product: listProduct, currency, open, onClose }: QuickViewProps) {
  const t = useT();
  const config = useStoreConfig();
  const { addItem, isLoading } = useCart();
  const { isInWishlist, toggle } = useWishlist();
  const [full, setFull] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const product = full ?? listProduct;
  const [selectedBarcode, setSelectedBarcode] = useState<Barcode | undefined>(() => defaultBarcode(listProduct));

  const minQty = Math.max(product.min_order_qty ?? product.min_order_quantity ?? 1, 1);
  const [qty, setQty] = useState(minQty);

  useEffect(() => {
    let alive = true;
    loadQuickViewProduct(listProduct.slug)
      .then((p) => {
        if (!alive || !p) return;
        setFull(p);
        setSelectedBarcode(defaultBarcode(p));
        setQty(Math.max(p.min_order_qty ?? p.min_order_quantity ?? 1, 1));
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [listProduct.slug]);

  // Same stock rule as the card until the full product arrives (list barcodes can report 0).
  const stock = full
    ? selectedBarcode?.stock ?? 0
    : Math.max(product.barcodes.reduce((s, b) => s + Math.max(b.stock, 0), 0), product.stock_qty ?? 0);
  const inStock = stock > 0;
  const price = Math.max(selectedBarcode?.effective_price ?? 0, 0);
  const original = selectedBarcode?.price ?? 0;
  const hasDiscount = original > price && price > 0;
  const maxQty = Math.max(product.max_order_qty ?? product.max_order_quantity ?? stock, 1);
  const href = `/products/${product.slug}`;
  const hasOptions = product.barcodes.length > 1;
  const wishlistOn = config.wishlist;
  const inWishlist = wishlistOn && isInWishlist(product.id);
  const code = selectedBarcode?.sku || product.sku;

  const galleryImages = [
    { url: product.image, id: 0 },
    ...(full?.images ?? []),
    ...(full?.video_id && full.video_provider
      ? [{ url: full.image, id: -1, kind: "video" as const, provider: full.video_provider, videoId: full.video_id }]
      : []),
  ];

  const handleVariantChange = (b: Barcode) => {
    setSelectedBarcode(b);
    setQty(minQty);
  };

  const addToCart = async () => {
    if (!selectedBarcode) return;
    await addItem(selectedBarcode.id, qty, product.name, price, selectedBarcode.stock, selectedBarcode.attributes);
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={product.name} bare className="max-w-[960px] rounded-none">
      <div className="quick-view pdp-main p-5 sm:p-10">
        <div className="relative min-w-0">
          {hasDiscount && (
            <span className="badge badge-discount pdp-badge">-{formatDiscount(original, price)}%</span>
          )}
          <ProductImageGallery key={full ? "full" : "list"} images={galleryImages} productName={product.name} />
        </div>

        <div className="pdp-info min-w-0">
          <h2 className="pdp-title pr-6">{product.name}</h2>

          {product.sale_count > 0 && (
            <p className="qv-sold">
              <Flame className="h-4 w-4" />
              {product.sale_count} {t("sold", "sold")}
            </p>
          )}

          <dl className="qv-meta">
            {product.brand?.name && (
              <>
                <dt>{t("brand", "Brand")}:</dt>
                <dd>{product.brand.name}</dd>
              </>
            )}
            {code && (
              <>
                <dt>{t("product_code", "Product Code")}:</dt>
                <dd>{code}</dd>
              </>
            )}
            <dt>{t("availability", "Availability")}:</dt>
            <dd className={cn(!inStock && "text-[var(--color-error)]")}>
              {inStock ? t("in_stock", "In Stock") : t("out_of_stock", "Out of Stock")}
            </dd>
          </dl>

          <div className="pdp-price-row">
            {hasDiscount && <s className="price-old">{formatPrice(original, currency)}</s>}
            <span className={cn("price", hasDiscount && "is-sale")}>{formatPrice(price, currency)}</span>
          </div>

          {product.short_description ? (
            <div
              className="pdp-short qv-short"
              dangerouslySetInnerHTML={{ __html: product.short_description }}
            />
          ) : (
            loading && (
              <div className="mt-[18px] space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            )
          )}

          {hasOptions && full ? (
            <div className="pdp-block">
              <ProductVariantSelector barcodes={product.barcodes} onChange={handleVariantChange} />
            </div>
          ) : (
            hasOptions && loading && <Skeleton className="pdp-block h-9 w-3/4" />
          )}

          <div className="pdp-block">
            <p className="pdp-label">{t("quantity", "Quantity")}:</p>
            <div className="qty-stepper">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(minQty, q - 1))}
                disabled={qty <= minQty}
                aria-label={t("decrease_qty", "Decrease quantity")}
              >
                <Minus className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <span aria-live="polite">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={qty >= maxQty}
                aria-label={t("increase_qty", "Increase quantity")}
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>

          <p className="pdp-subtotal">
            {t("subtotal", "Subtotal")}: <strong>{formatPrice(price * qty, currency)}</strong>
          </p>

          <div className="pdp-cta">
            <div className="flex gap-[15px]">
              <button
                onClick={addToCart}
                disabled={isLoading || !inStock || (hasOptions && !full)}
                className="btn btn-cart flex-1"
              >
                {inStock ? t("add_to_cart", "Add to Cart") : t("sold_out", "Sold out")}
              </button>
              {wishlistOn && (
                <button
                  type="button"
                  onClick={() =>
                    toggle(product.slug, product.id, { id: selectedBarcode?.id ?? product.id, name: product.name, price, quantity: 1 })
                  }
                  aria-label={inWishlist ? t("remove_from_wishlist", "Remove from wishlist") : t("add_to_wishlist", "Add to wishlist")}
                  aria-pressed={inWishlist}
                  className="pdp-wish"
                >
                  <Heart className={cn("h-5 w-5", inWishlist && "fill-current")} strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>

          <div className="qv-footer">
            {product.view_count > 0 && (
              <p className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {product.view_count} {t("views", "views")}
              </p>
            )}
            <Link href={href} onClick={onClose} className="qv-details">
              {t("view_details", "View details")}
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
