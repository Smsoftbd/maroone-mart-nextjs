"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { ShareButtons } from "./ShareButtons";
import { useCart } from "@/lib/hooks/useCart";
import { formatPrice, formatDiscount } from "@/lib/utils/format";
import { splitPhones } from "@/lib/utils/phone";
import { cn } from "@/lib/utils/cn";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTheme } from "@/components/providers/StoreConfigProvider";
import { track } from "@/lib/analytics/track";
import type { Product, Barcode } from "@/lib/api/types";

interface ProductInfoProps {
  product: Product;
  currency: string;
  shareUrl: string;
  /** Store phone field; may hold several numbers separated by commas. */
  phone?: string;
  questionCount: number;
  /** Gallery rendered in the left column. */
  gallery: ReactNode;
  /** Server-rendered details (description, reviews, Q&A) under both columns. */
  children?: ReactNode;
  /** Chat links for the two gradient buttons under the CTAs. */
  whatsapp?: string | null;
  facebook?: string | null;
}

const LOW_STOCK = 5;

/**
 * Product page, in the reference storefront's shape: gallery on the left, and
 * on the right the title, the category/brand/code line, the green price, a
 * quantity stepper, the Order Now / 1 Click Order / Add to Cart trio, the two
 * chat bars and the share row. The detail panels run full width underneath.
 */
export function ProductInfo({
  product,
  currency,
  shareUrl,
  phone,
  questionCount,
  gallery,
  children,
  whatsapp,
  facebook,
}: ProductInfoProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { sticky_cart: stickyCart, show_stock: showStock } = useTheme().product;
  const [selectedBarcode, setSelectedBarcode] = useState<Barcode>(
    product.barcodes.find((b) => b.is_active) ?? product.barcodes[0]
  );
  const { addItem, isLoading } = useCart();

  const minQty = Math.max(product.min_order_qty ?? product.min_order_quantity ?? 1, 1);
  const stock = selectedBarcode?.stock ?? 0;
  const [qty, setQty] = useState(minQty);

  const price = Math.max(selectedBarcode?.effective_price ?? 0, 0);
  const original = selectedBarcode?.price ?? 0;
  const hasDiscount = original > price && price > 0;
  const discountPct = hasDiscount ? formatDiscount(original, price) : null;
  const inStock = stock > 0;
  const lowStock = inStock && stock <= LOW_STOCK;
  const category = product.child_category ?? product.sub_category ?? product.category;
  const phones = splitPhones(phone);
  const maxQty = Math.max(product.max_order_qty ?? product.max_order_quantity ?? stock, 1);

  // Mobile sticky buy bar: shown once the CTA row scrolls above the viewport.
  const ctaRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || !stickyCart) return;
    const io = new IntersectionObserver(([entry]) => {
      setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [stickyCart]);
  useEffect(() => {
    if (showSticky) document.body.dataset.stickyCta = "";
    else delete document.body.dataset.stickyCta;
    return () => {
      delete document.body.dataset.stickyCta;
    };
  }, [showSticky]);

  useEffect(() => {
    track.viewContent({
      id: selectedBarcode?.id ?? product.id,
      name: product.name,
      price,
      quantity: 1,
      category: category?.name,
    });
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVariantChange = (b: Barcode) => {
    setSelectedBarcode(b);
    setQty(minQty);
  };

  const addSelected = async (openDrawer = true) => {
    if (!selectedBarcode) return false;
    await addItem(
      selectedBarcode.id,
      qty,
      product.name,
      price,
      selectedBarcode.stock,
      selectedBarcode.attributes,
      { openDrawer }
    );
    return true;
  };

  const handleBuyNow = async () => {
    if (await addSelected(false)) router.push("/checkout");
  };

  const disabled = isLoading || !inStock;

  const ctaButtons = (
    <div className="pdp-cta grid gap-3 sm:grid-cols-3">
      <button onClick={() => addSelected()} disabled={disabled} className="btn btn-outline">
        <Zap className="h-[18px] w-[18px]" strokeWidth={2} />
        {t("order_now", "Order Now")}
      </button>
      <button onClick={handleBuyNow} disabled={disabled} className="btn btn-buy">
        <Zap className="h-[18px] w-[18px] fill-current" strokeWidth={1.75} />
        {inStock ? t("one_click_order", "1 Click Order") : t("out_of_stock", "Out of Stock")}
      </button>
      <button onClick={() => addSelected()} disabled={disabled} className="btn btn-cart">
        <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.75} />
        {t("add_to_cart", "Add to Cart")}
      </button>
    </div>
  );

  const chatLinks = (whatsapp || facebook || phones.length > 0) && (
    <div className="space-y-2.5">
      {(whatsapp || phones.length > 0) && (
        <a
          href={
            whatsapp ||
            `https://wa.me/${phones[0].replace(/[^\d]/g, "")}?text=${encodeURIComponent(product.name)}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="chat-btn is-whatsapp"
        >
          <svg className="h-[18px] w-[18px]" viewBox="0 0 448 512" fill="currentColor">
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 110.9L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6z" />
          </svg>
          {t("contact_with_whatsapp", "Contact with WhatsApp")}
        </a>
      )}
      {facebook && (
        <a href={facebook} target="_blank" rel="noopener noreferrer" className="chat-btn is-facebook">
          <svg className="h-[18px] w-[18px]" viewBox="0 0 320 512" fill="currentColor">
            <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
          </svg>
          {t("contact_with_facebook", "Contact with Facebook")}
        </a>
      )}
    </div>
  );

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        {/* Left: gallery (sticky on desktop) */}
        <div className="min-w-0">
          <div className="lg:sticky lg:top-32">{gallery}</div>
        </div>

        {/* Right: everything the shopper acts on */}
        <div className="min-w-0">
          <h1 className="font-display text-[26px] font-bold uppercase leading-tight text-[var(--color-text-primary)] sm:text-[32px]">
            {product.name}
          </h1>

          <div className="pdp-meta mt-2.5">
            {category && (
              <span>
                {t("category", "Category")}:{" "}
                <Link
                  href={`/products?category=${encodeURIComponent(category.slug)}`}
                  className="font-bold text-[var(--color-text-primary)] hover:text-brand-ink"
                >
                  {category.name}
                </Link>
              </span>
            )}
            {product.brand && (
              <span>
                {t("brand", "Brand")}:{" "}
                <Link
                  href={`/products?brands=${product.brand.id}`}
                  className="font-bold text-[var(--color-text-primary)] hover:text-brand-ink"
                >
                  {product.brand.name}
                </Link>
              </span>
            )}
            {product.sku && (
              <span>
                {t("product_code", "Product Code")}: <strong>{product.sku}</strong>
              </span>
            )}
          </div>

          <p
            className={cn(
              "mt-3 flex items-center gap-2 text-sm font-medium",
              inStock ? (lowStock ? "is-low" : "is-in") : "is-out"
            )}
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-current" aria-hidden />
            {!inStock
              ? t("out_of_stock", "Out of Stock")
              : lowStock
              ? `${t("only", "Only")} ${stock} ${t("left_in_stock", "left in stock")}`
              : t("in_stock", "In Stock")}
          </p>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="pdp-price">{formatPrice(price, currency)}</span>
            {hasDiscount && (
              <>
                <s className="price-old text-base">{formatPrice(original, currency)}</s>
                <span className="badge badge-discount">
                  {discountPct}% {t("off", "OFF")}
                </span>
              </>
            )}
          </div>

          {/* Short description */}
          {product.short_description && (
            <div
              className="prose-content mt-4 max-w-none text-sm text-[var(--color-text-secondary)] [&_p:last-child]:mb-0"
              dangerouslySetInnerHTML={{ __html: product.short_description }}
            />
          )}

          {/* Variants */}
          {product.barcodes.length > 1 && (
            <div className="mt-5">
              <ProductVariantSelector barcodes={product.barcodes} onChange={handleVariantChange} />
            </div>
          )}

          {/* Quantity */}
          <div className="mt-6">
            <p className="pdp-label mb-2">{t("quantity", "Quantity")}</p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="qty-stepper">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(minQty, q - 1))}
                  disabled={qty <= minQty}
                  aria-label={t("decrease_qty", "Decrease quantity")}
                >
                  <Minus className="h-4 w-4" strokeWidth={2} />
                </button>
                <span aria-live="polite">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  disabled={qty >= maxQty}
                  aria-label={t("increase_qty", "Increase quantity")}
                >
                  <Plus className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
              {(showStock || !inStock || lowStock) && (
                <span className={cn("text-sm font-medium", inStock ? (lowStock ? "is-low" : "is-in") : "is-out")}>
                  {!inStock ? t("out_of_stock", "Out of Stock") : t("in_stock", "In Stock")}
                </span>
              )}
            </div>
          </div>

          <div ref={ctaRef} className="mt-6 space-y-3">
            {ctaButtons}
            {chatLinks}
          </div>

          <div className="mt-6">
            <ShareButtons url={shareUrl} title={product.name} />
          </div>

          {questionCount > 0 && (
            <a
              href="#product-questions"
              className="mt-4 inline-block text-sm text-[var(--color-text-secondary)] hover:text-brand-ink"
            >
              {questionCount} {t("questions_answers", "Q&A")}
            </a>
          )}
        </div>
      </div>

      {/* Description / Contact / Q&A, full width under both columns. */}
      {children}

      {/* Phones: fixed Add to cart / Buy now bar. */}
      <div className="sticky-buy-bar is-phone md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface-0)] px-3 pt-3 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="pdp-cta grid grid-cols-2 gap-3">
          <button onClick={() => addSelected()} disabled={disabled} className="btn btn-cart">
            <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.75} />
            {t("add_to_cart", "Add to Cart")}
          </button>
          <button onClick={handleBuyNow} disabled={disabled} className="btn btn-buy">
            <Zap className="h-[18px] w-[18px] fill-current" strokeWidth={1.75} />
            {inStock ? t("order_now", "Order Now") : t("out_of_stock", "Out of Stock")}
          </button>
        </div>
      </div>

      {/* Tablets: compact bar once the CTA row scrolls away (product.sticky_cart) */}
      {stickyCart && (
        <div
          className={cn(
            "sticky-buy-bar hidden md:block lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface-0)]/95 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-300",
            showSticky ? "translate-y-0" : "translate-y-full"
          )}
          aria-hidden={!showSticky}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-[var(--color-text-secondary)]">{product.name}</p>
              <p>
                <span className={cn("price", hasDiscount && "is-sale")}>{formatPrice(price, currency)}</span>
                {hasDiscount && <s className="price-old ml-2 text-xs">{formatPrice(original, currency)}</s>}
              </p>
            </div>
            <button
              onClick={() => addSelected()}
              disabled={disabled}
              tabIndex={showSticky ? 0 : -1}
              aria-label={t("add_to_cart", "Add to Cart")}
              className="btn btn-cart w-11 shrink-0 !px-0"
            >
              <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
            <button
              onClick={handleBuyNow}
              disabled={disabled}
              tabIndex={showSticky ? 0 : -1}
              className="btn btn-buy shrink-0 text-sm"
            >
              {t("order_now", "Order Now")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
