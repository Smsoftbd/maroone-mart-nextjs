"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Heart,
  MessageCircleQuestion,
  Phone,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Zap,
} from "lucide-react";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { ShareButtons } from "./ShareButtons";
import { Rating } from "@/components/ui/Rating";
import { useCart } from "@/lib/hooks/useCart";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { formatPrice, formatDiscount } from "@/lib/utils/format";
import { resolveL10n } from "@/lib/utils/l10n";
import { splitPhones } from "@/lib/utils/phone";
import { cn } from "@/lib/utils/cn";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTheme } from "@/components/providers/StoreConfigProvider";
import { track } from "@/lib/analytics/track";
import type { Product, Barcode, DeliveryCharge } from "@/lib/api/types";

interface ProductInfoProps {
  product: Product;
  currency: string;
  shareUrl: string;
  /** Store phone field; may hold several numbers separated by commas. */
  phone?: string;
  deliveryCharges: DeliveryCharge[];
  questionCount: number;
  /** Gallery rendered in the left column above the CTAs. */
  gallery: ReactNode;
  /** Server-rendered details (description, reviews, Q&A) under the info column. */
  children?: ReactNode;
}

const LOW_STOCK = 5;

export function ProductInfo({
  product,
  currency,
  shareUrl,
  phone,
  deliveryCharges,
  questionCount,
  gallery,
  children,
}: ProductInfoProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  // product.sticky_cart / show_trust / show_stock / show_wishlist; the page
  // always shows the rating and the old price.
  const {
    sticky_cart: stickyCart,
    show_trust: showTrust,
    show_stock: showStock,
    show_wishlist: showWishlist,
  } = useTheme().product;
  const [selectedBarcode, setSelectedBarcode] = useState<Barcode>(
    product.barcodes.find((b) => b.is_active) ?? product.barcodes[0]
  );
  const { addItem, isLoading } = useCart();
  const { isInWishlist, toggle } = useWishlist();
  const [shareOpen, setShareOpen] = useState(false);

  const minQty = Math.max(product.min_order_qty ?? product.min_order_quantity ?? 1, 1);
  const stock = selectedBarcode?.stock ?? 0;
  // No quantity stepper on the page; the cart always gets the minimum order qty.
  const [qty, setQty] = useState(minQty);

  const price = Math.max(selectedBarcode?.effective_price ?? 0, 0);
  const original = selectedBarcode?.price ?? 0;
  const hasDiscount = original > price && price > 0;
  const discountPct = hasDiscount ? formatDiscount(original, price) : null;
  const inStock = stock > 0;
  const lowStock = inStock && stock <= LOW_STOCK;
  const inWishlist = isInWishlist(product.id);
  const category = product.child_category ?? product.sub_category ?? product.category;
  const phones = splitPhones(phone);

  // Mobile sticky buy bar: shown once the mobile CTA row scrolls above the viewport.
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
    <div className="pdp-cta grid grid-cols-2 gap-4">
      <button
        onClick={() => addSelected()}
        disabled={disabled}
        className="btn btn-cart"
      >
        <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.75} />
        {t("add_to_cart", "Add to Cart")}
      </button>
      <button
        onClick={handleBuyNow}
        disabled={disabled}
        className="btn btn-buy"
      >
        <Zap className="h-[18px] w-[18px] fill-current" strokeWidth={1.75} />
        {inStock ? t("buy_now", "Buy Now") : t("out_of_stock", "Out of Stock")}
      </button>
    </div>
  );

  const callLine = phones.length > 0 && (
    <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm max-lg:text-base">
      <span className="font-semibold text-[var(--color-text-primary)] lg:font-medium">
        {t("call_us", "Call us")}
      </span>
      {phones.map((p, i) => (
        <span key={p} className="inline-flex items-center gap-2">
          {i > 0 && (
            <span className="text-[var(--color-text-secondary)]">{t("or", "or")}</span>
          )}
          <a
            href={`tel:${p}`}
            className="inline-flex items-center gap-1 font-semibold text-brand-ink hover:text-brand-ink tabular-nums max-lg:text-lg"
          >
            <Phone className="h-3.5 w-3.5 fill-current max-lg:h-4 max-lg:w-4" />
            {p}
          </a>
        </span>
      ))}
    </p>
  );

  const deliveryItems = [
    ...deliveryCharges.map((d) => ({
      key: `d-${d.id}`,
      icon: Truck,
      title: `${t("delivery_charge", "Delivery charge")}:`,
      text: `${resolveL10n(d.zone_name, locale)} : ${currency}${Number(d.charge_amount).toLocaleString("en-US")}`,
    })),
    {
      key: "cod",
      icon: CreditCard,
      title: null,
      text: t("cash_on_delivery_nationwide", "Cash on delivery all over the country"),
    },
    {
      key: "secure",
      icon: ShieldCheck,
      title: null,
      text: t("secure_payment_easy", "Easy and secure payment"),
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
      {/* Left: gallery + CTAs (sticky on desktop) */}
      <div className="min-w-0">
        <div className="lg:sticky lg:top-32 space-y-4">
          {gallery}
          <div className="hidden lg:block space-y-4">
            {ctaButtons}
            {callLine}
          </div>
        </div>
      </div>

      {/* Right: info + details */}
      <div className="min-w-0 product-content-wrap">
        {/* Eyebrow: category · brand */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium max-md:text-[15px] max-md:font-semibold">
          {category && (
            <Link
              href={`/products?category=${encodeURIComponent(category.slug)}`}
              className={cn("text-brand-ink hover:text-brand-ink transition-colors", product.brand && "max-md:hidden")}
            >
              {category.name}
            </Link>
          )}
          {category && product.brand && (
            <span aria-hidden className="text-[var(--color-text-muted)] max-md:hidden">·</span>
          )}
          {product.brand && (
            <Link
              href={`/products?brands=${product.brand.id}`}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors max-md:text-brand-ink"
            >
              {product.brand.name}
            </Link>
          )}
        </div>

        {/* Title + wishlist */}
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <h1 className="font-display text-[22px] font-bold sm:text-2xl md:font-semibold text-[var(--color-text-primary)] leading-snug">
            {product.name}
          </h1>
          {showWishlist && (
          <button
            onClick={() =>
              toggle(product.slug, product.id, {
                id: selectedBarcode?.id ?? product.id,
                name: product.name,
                price,
                quantity: 1,
                category: category?.name,
              })
            }
            aria-label={inWishlist ? t("remove_from_wishlist", "Remove from wishlist") : t("add_to_wishlist", "Add to wishlist")}
            aria-pressed={inWishlist}
            className={cn(
              "shrink-0 h-9 w-9 rounded-full border flex items-center justify-center transition-colors",
              inWishlist
                ? "border-[var(--color-text-primary)] text-[var(--color-text-primary)]"
                : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-primary)] hover:text-[var(--color-text-primary)]"
            )}
          >
            <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
          </button>
          )}
        </div>

        {/* Rating · Q&A · Share (phones: two rows of two) */}
        <div className="mt-3 grid grid-cols-2 gap-y-2.5 text-[15px] text-[var(--color-text-primary)] md:mt-2 md:flex md:flex-wrap md:items-center md:gap-x-3 md:gap-y-1.5 md:text-sm md:text-[var(--color-text-secondary)]">
          <a href="#product-reviews" className="inline-flex items-center gap-1.5 hover:text-[var(--color-text-primary)]">
            <Rating value={product.rating_avg} className="max-md:[&_svg]:h-6 max-md:[&_svg]:w-6" />
            <span className="tabular-nums">{Number(product.rating_avg.toFixed(1))}</span>
          </a>
          <a
            href="#product-reviews"
            className="inline-flex items-center gap-3 border-l border-[var(--color-border-dark)] pl-3 hover:text-[var(--color-text-primary)] md:border-0 md:pl-0"
          >
            <span className="hidden h-3 w-px bg-[var(--color-border-dark)] md:block" aria-hidden />
            {product.rating_count} {t("ratings", "Ratings")}
          </a>
          <span className="hidden h-3 w-px bg-[var(--color-border-dark)] md:block" aria-hidden />
          <a href="#product-questions" className="inline-flex items-center gap-1.5 hover:text-[var(--color-text-primary)]">
            {/* Teal bubble with a white mark, like the reference storefront. */}
            <MessageCircleQuestion
              className="h-5 w-5 fill-[var(--color-secondary-500)] text-[var(--color-secondary-text,#fff)] md:h-[18px] md:w-[18px]"
              strokeWidth={2}
            />
            {questionCount} {t("questions_answers", "Q&A")}
          </a>
          <span className="hidden h-3 w-px bg-[var(--color-border-dark)] md:block" aria-hidden />
          <button
            type="button"
            onClick={() => setShareOpen((o) => !o)}
            aria-expanded={shareOpen}
            className="inline-flex items-center gap-1.5 border-l border-[var(--color-border-dark)] pl-3 hover:text-[var(--color-text-primary)] md:border-0 md:pl-0"
          >
            <Share2 className="h-5 w-5 md:h-4 md:w-4" />
            {t("share", "Share")}
          </button>
          {product.sale_count > 0 && (
            <>
              <span className="hidden h-3 w-px bg-[var(--color-border-dark)] md:block" aria-hidden />
              <span className="col-span-2">
                {product.sale_count.toLocaleString("en-US")} {t("sold", "sold")}
              </span>
            </>
          )}
        </div>
        {shareOpen && (
          <div className="mt-3 rounded-lg border border-[var(--color-border)] px-3 py-2">
            <ShareButtons url={shareUrl} title={product.name} />
          </div>
        )}

        {/* Price */}
        <div className="product-price-row mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 md:mt-5">
          <span className={cn("price text-2xl", hasDiscount && "is-sale")}>
            {formatPrice(price, currency)}
          </span>
          {hasDiscount && (
            <>
              <s className="price-old text-sm max-md:text-base">{formatPrice(original, currency)}</s>
              <span className="badge badge-discount max-md:rounded-md max-md:px-2 max-md:py-1.5 max-md:text-[15px] max-md:!bg-[var(--color-tertiary-500)]">
                {discountPct}% {t("off", "OFF")}
              </span>
            </>
          )}
        </div>

        {/* Stock — product.show_stock; "out"/"low" always warn. */}
        {(showStock || !inStock || lowStock) && (
        <p
          className={cn(
            "mt-2 text-sm font-medium",
            inStock ? (lowStock ? "is-low" : "is-in max-md:hidden") : "is-out"
          )}
        >
          {!inStock
            ? t("out_of_stock", "Out of Stock")
            : lowStock
            ? `${t("only", "Only")} ${stock} ${t("left_in_stock", "left in stock")}`
            : t("in_stock", "In Stock")}
        </p>
        )}

        {/* Short description */}
        {product.short_description && (
          <div
            className="prose-content max-w-none text-sm text-[var(--color-text-secondary)] mt-4 [&_p:last-child]:mb-0"
            dangerouslySetInnerHTML={{ __html: product.short_description }}
          />
        )}

        {/* Variants */}
        {product.barcodes.length > 1 && (
          <div className="mt-5">
            <ProductVariantSelector
              barcodes={product.barcodes}
              onChange={handleVariantChange}
            />
          </div>
        )}

        {/* Mobile CTAs (desktop CTAs sit under the gallery) */}
        <div ref={ctaRef} className="mt-5 hidden space-y-3 md:block lg:hidden">
          {ctaButtons}
          {callLine}
        </div>

        {/* Delivery / payment info (product.show_trust) */}
        {showTrust && (
        <ul className="product-trust mt-6 grid gap-x-6 gap-y-4 rounded-lg border border-[var(--color-border)] bg-surface-50 p-4 sm:grid-cols-2 md:gap-y-7 md:bg-surface-100 md:p-6">
          {deliveryItems.map(({ key, icon: Icon, title, text }) => (
            <li key={key} className="flex items-start gap-3 text-xs max-md:text-[15px] md:text-sm">
              <Icon className="h-5 w-5 shrink-0 text-brand-ink max-md:h-7 max-md:w-7 max-md:text-[var(--color-text-primary)] md:h-6 md:w-6 md:text-[var(--color-text-secondary)]" strokeWidth={1.25} />
              <span className="min-w-0 leading-relaxed">
                {title && (
                  <span className="block text-[var(--color-text-secondary)] max-md:text-[var(--color-text-primary)]">{title}</span>
                )}
                <span className="text-[var(--color-text-primary)] md:text-[var(--color-text-secondary)]">{text}</span>
              </span>
            </li>
          ))}
        </ul>
        )}

        {children}
      </div>

      {/* Phones: fixed Add to cart / Buy now + hotline, always visible. */}
      <div className="sticky-buy-bar is-phone md:hidden fixed inset-x-0 bottom-0 z-40 space-y-2.5 border-t border-[var(--color-border)] bg-[var(--color-surface-0)] px-3 pt-3 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        {ctaButtons}
        {callLine}
      </div>

      {/* Tablets: compact bar once the inline CTA row scrolls away (product.sticky_cart) */}
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
              {hasDiscount && (
                <s className="price-old ml-2 text-xs">{formatPrice(original, currency)}</s>
              )}
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
            {t("buy_now", "Buy Now")}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
