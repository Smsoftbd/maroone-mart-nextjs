"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, Heart, Minus, Plus } from "lucide-react";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { useCart } from "@/lib/hooks/useCart";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { formatPrice, formatDiscount } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useStoreConfig, useTheme } from "@/components/providers/StoreConfigProvider";
import { track } from "@/lib/analytics/track";
import type { Product, Barcode } from "@/lib/api/types";

interface ProductInfoProps {
  product: Product;
  currency: string;
  /** Gallery rendered in the left column. */
  gallery: ReactNode;
  /** Server-rendered details (description, reviews, Q&A) under both columns. */
  children?: ReactNode;
}

/**
 * Product page, in the reference storefront's shape: gallery on the left, and
 * on the right the title, list/sale price, option pills, quantity, subtotal,
 * the pink Add to cart (+ wishlist square) and the black Buy it now. The
 * detail tabs run full width underneath; a slim add-to-cart bar slides up
 * from the bottom once the buttons scroll away.
 */
export function ProductInfo({ product, currency, gallery, children }: ProductInfoProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { sticky_cart: stickyCart } = useTheme().product;
  const config = useStoreConfig();
  const { isInWishlist, toggle } = useWishlist();
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
  const category = product.child_category ?? product.sub_category ?? product.category;
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
  const wishlistOn = config.wishlist;
  const inWishlist = wishlistOn && isInWishlist(product.id);
  const subtotal = price * qty;

  const variantLabel = (b: Barcode) => {
    const name = b.attributes.map((a) => a.value).join(" / ");
    return `${name || product.name} - ${formatPrice(Math.max(b.effective_price ?? 0, 0), currency)}`;
  };

  const stepper = (size: "md" | "sm" = "md") => (
    <div className={cn("qty-stepper", size === "sm" && "is-sm")}>
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
  );

  return (
    <>
      <div className="pdp-main">
        {/* Left: gallery, with the discount tag on the photo */}
        <div className="relative min-w-0">
          {discountPct && <span className="badge badge-discount pdp-badge">-{discountPct}%</span>}
          {gallery}
        </div>

        {/* Right: title, price, options, quantity and the two CTAs */}
        <div className="pdp-info min-w-0">
          <h1 className="pdp-title">{product.name}</h1>

          <div className="pdp-price-row">
            {hasDiscount && <s className="price-old">{formatPrice(original, currency)}</s>}
            <span className={cn("price", hasDiscount && "is-sale")}>{formatPrice(price, currency)}</span>
          </div>

          {product.barcodes.length > 1 && (
            <div className="pdp-block">
              <ProductVariantSelector barcodes={product.barcodes} onChange={handleVariantChange} />
            </div>
          )}

          <div className="pdp-block">
            <p className="pdp-label">{t("quantity", "Quantity")}:</p>
            {stepper()}
          </div>

          <p className="pdp-subtotal">
            {t("subtotal", "Subtotal")}: <strong>{formatPrice(subtotal, currency)}</strong>
          </p>

          <div ref={ctaRef} className="pdp-cta">
            <div className="flex gap-[15px]">
              <button onClick={() => addSelected()} disabled={disabled} className="btn btn-cart flex-1">
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
            <button onClick={handleBuyNow} disabled={disabled} className="btn btn-buy w-full">
              {t("buy_it_now", "Buy it now")}
            </button>
          </div>
        </div>
      </div>

      {/* Description / Shipping / Reviews tabs, full width under both columns. */}
      {children}

      {/* Phones: fixed Add to cart / Buy now bar. */}
      <div className="sticky-buy-bar is-phone md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface-0)] px-3 pt-3 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="pdp-cta grid grid-cols-2 gap-3">
          <button onClick={() => addSelected()} disabled={disabled} className="btn btn-cart">
            {t("add_to_cart", "Add to Cart")}
          </button>
          <button onClick={handleBuyNow} disabled={disabled} className="btn btn-buy">
            {inStock ? t("buy_it_now", "Buy it now") : t("sold_out", "Sold out")}
          </button>
        </div>
      </div>

      {/* Tablet and up: slim bar once the CTAs scroll away (product.sticky_cart) */}
      {stickyCart && (
        <div
          className={cn("pdp-sticky hidden md:block", showSticky && "is-visible")}
          aria-hidden={!showSticky}
        >
          <div className="pdp-sticky-inner">
            <div className="pdp-sticky-product">
              {product.image && (
                <Image src={product.image} alt="" width={50} height={50} className="h-[50px] w-[50px] shrink-0 object-contain" />
              )}
              <p className="line-clamp-1">{product.name}</p>
            </div>
            {product.barcodes.length > 1 ? (
              <span className="shop-toolbar-select pdp-sticky-select">
                <select
                  value={selectedBarcode?.id}
                  tabIndex={showSticky ? 0 : -1}
                  onChange={(e) => {
                    const b = product.barcodes.find((x) => x.id === Number(e.target.value));
                    if (b) handleVariantChange(b);
                  }}
                  aria-label={t("select_options", "Select options")}
                >
                  {product.barcodes.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.stock <= 0}>
                      {variantLabel(b)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
              </span>
            ) : (
              <span className="pdp-sticky-price">{formatPrice(price, currency)}</span>
            )}
            {stepper("sm")}
            <button
              onClick={() => addSelected()}
              disabled={disabled}
              tabIndex={showSticky ? 0 : -1}
              className="btn btn-cart pdp-sticky-btn"
            >
              {inStock ? t("add_to_cart", "Add to Cart") : t("sold_out", "Sold out")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
