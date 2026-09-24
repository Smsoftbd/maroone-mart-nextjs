"use client";

/**
 * ProductCard
 * @usage
 * <ProductCard product={product} currency="৳" />
 * Used in: ProductGrid, ProductCarousel, homepage sections, RelatedProducts
 *
 * The card is driven by the Appearance theme (product.*, layout.card_style,
 * effects.card_hover …): alignment, title lines, hover image, add-to-cart
 * style, quick view, badges, discount format, rating style, brand, swatches
 * and the show/hide toggles. Frame, hover and badge looks live in globals.css.
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Eye, Heart, ShoppingBag, ShoppingBasket, ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { useT } from "@/lib/i18n/I18nProvider";
import { useStoreConfig } from "@/components/providers/StoreConfigProvider";
import { Rating } from "@/components/ui/Rating";
import { formatPrice, formatDiscount } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useSelectItem } from "@/components/analytics/ItemListTracker";
import type { Product } from "@/lib/api/types";

const QuickView = dynamic(() => import("./QuickView").then((m) => m.QuickView), { ssr: false });

/** Legacy per-page looks; every variant now renders the one themed card. */
export type ProductCardVariant = "default" | "minimal" | "shop";

interface ProductCardProps {
  product: Product;
  currency: string;
  showWishlist?: boolean;
  variant?: ProductCardVariant;
  /** Always show the wide button under the price (sidebar widget), whatever product.add_to_cart says. */
  button?: boolean;
}

const LOW_STOCK = 5;
const CART_ICONS = { bag: ShoppingBag, cart: ShoppingCart, basket: ShoppingBasket };
const isHex = (c?: string): c is string => !!c && /^#[0-9a-f]{3,8}$/i.test(c);

export function ProductCard({ product, currency, showWishlist = true, button = false }: ProductCardProps) {
  const router = useRouter();
  const { addItem, isLoading } = useCart();
  const { isInWishlist, toggle } = useWishlist();
  const config = useStoreConfig();
  const { product: opts, layout } = config.theme;
  const t = useT();
  const selectItem = useSelectItem(product);
  const [quickOpen, setQuickOpen] = useState(false);
  // select_item when a product link (image/title) is followed from a tracked list.
  const onCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) selectItem();
  };

  const isVariable = product.type === "variable";
  const defaultBarcode = product.barcodes.find((b) => b.is_active) ?? product.barcodes[0];
  const price = Math.max(defaultBarcode?.effective_price ?? 0, 0);
  const original = defaultBarcode?.price ?? 0;
  const hasDiscount = original > price && price > 0;
  // List endpoint can return per-barcode stock=0 even when the product has
  // stock; fall back to the product-level stock_qty so cards don't wrongly
  // show "Out of Stock". Per-variant stock stays authoritative on the detail page.
  const stock = Math.max(
    product.barcodes.reduce((sum, b) => sum + Math.max(b.stock, 0), 0),
    product.stock_qty ?? 0
  );
  const inStock = stock > 0;
  const href = `/products/${product.slug}`;
  const CartIcon = CART_ICONS[layout.cart_icon];

  const saleLabel = !hasDiscount
    ? null
    : opts.sale_display === "amount"
    ? `${t("save", "Save")} ${formatPrice(original - price, currency)}`
    : opts.sale_display === "label"
    ? t("sale", "SALE")
    : `-${formatDiscount(original, price)}%`;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!defaultBarcode) return;
    if (isVariable) {
      router.push(href);
      return;
    }
    await addItem(defaultBarcode.id, 1, product.name, price, defaultBarcode.stock);
  };

  // "4.5 ★ | 12": the compact rating line, and the phone fallback for star rows.
  const ratingPill = (className?: string) => (
    <p className={cn("card-rating-pill", className)}>
      <span className="tabular-nums">{Number(product.rating_avg || 0).toFixed(Number(product.rating_avg) % 1 ? 1 : 0)}</span>
      <Star className="h-3 w-3 fill-current text-[var(--color-commerce-rating-star,var(--color-tertiary-ink))]" />
      <span className="h-3 w-px bg-[var(--color-border-dark)]" aria-hidden />
      <span className="tabular-nums">{product.rating_count ?? 0}</span>
    </p>
  );

  const rating = opts.show_rating && (
    opts.rating_style === "compact" ? (
      ratingPill()
    ) : (
      <>
        <Rating value={Number(product.rating_avg || 0)} count={product.rating_count ?? 0} className="card-rating" />
        {ratingPill("md:hidden")}
      </>
    )
  );

  // Reference order: struck-through list price first, then the sale price.
  const priceRow = (
    <div className="card-price">
      {hasDiscount && opts.show_old_price && (
        <s className="price-old">{formatPrice(original, currency)}</s>
      )}
      <span className={cn("price", hasDiscount && "is-sale")}>{formatPrice(price, currency)}</span>
    </div>
  );

  const stockLine = opts.show_stock && (
    <p
      className={cn(
        "card-stock text-xs font-medium",
        !inStock ? "is-out" : stock <= LOW_STOCK ? "is-low" : "is-in"
      )}
    >
      {!inStock
        ? t("out_of_stock", "Out of Stock")
        : stock <= LOW_STOCK
        ? `${t("only", "Only")} ${stock} ${t("left_in_stock", "left in stock")}`
        : t("in_stock", "In Stock")}
    </p>
  );

  const altImage =
    opts.hover_image && product.images?.find((img) => img.url && img.url !== product.image)?.url;
  const swatches = opts.show_swatches
    ? [
        ...new Set(
          product.barcodes.flatMap((b) => b.attributes.map((a) => a.value_code).filter(isHex))
        ),
      ].slice(0, 5)
    : [];
  const wishlistOn = config.wishlist && showWishlist && opts.show_wishlist;
  const inWishlist = wishlistOn && isInWishlist(product.id);
  const addLabel = isVariable ? t("select_options", "Select options") : t("add_to_cart", "Add to Cart");

  /* One wide button: "Add to cart" for a simple product, "Choose options"
     (opens the product page) when it has variants. */
  const actionRow = (
    <div className="card-actions">
      <button
        onClick={handleAddToCart}
        disabled={isLoading || !inStock}
        className="btn btn-cart card-action-btn"
      >
        {!inStock
          ? t("sold_out", "Sold out")
          : isVariable
          ? t("choose_options", "Choose options")
          : t("add_to_cart", "Add to Cart")}
      </button>
    </div>
  );

  return (
    <div className="product-card store-card group relative flex h-full flex-col" onClickCapture={onCardClick}>
      <div className="card-img store-card-img relative overflow-hidden">
        <Link href={href} className="block aspect-product" tabIndex={-1} aria-hidden>
          <Image
            src={product.image}
            alt=""
            width={400}
            height={400}
            loading="lazy"
            sizes="(min-width: 1024px) 240px, 50vw"
            className="card-img-main h-full w-full"
          />
          {altImage && (
            <Image
              src={altImage}
              alt=""
              width={400}
              height={400}
              loading="lazy"
              sizes="(min-width: 1024px) 240px, 50vw"
              className="card-img-alt absolute inset-0 h-full w-full"
            />
          )}
        </Link>

        {(saleLabel || !inStock) && (
          <div className="card-badges">
            {saleLabel && <span className="badge badge-discount">{saleLabel}</span>}
            {!inStock && <span className="badge badge-soldout">{t("sold_out", "Sold out")}</span>}
          </div>
        )}

        {wishlistOn && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggle(product.slug, product.id, { id: defaultBarcode?.id ?? product.id, name: product.name, price, quantity: 1 });
            }}
            aria-label={inWishlist ? t("remove_from_wishlist", "Remove from wishlist") : t("add_to_wishlist", "Add to wishlist")}
            aria-pressed={inWishlist}
            className={cn("card-wishlist", inWishlist && "is-active")}
          >
            <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
          </button>
        )}

        {opts.add_to_cart === "icon" && (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isLoading || !inStock}
            aria-label={addLabel}
            className="card-cart-icon btn-cart"
          >
            <CartIcon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
        )}

        {opts.quick_view && (
          <button type="button" onClick={() => setQuickOpen(true)} className="card-quick-view">
            <Eye className="h-3.5 w-3.5" />
            {t("quick_view", "Quick view")}
          </button>
        )}

        {opts.add_to_cart === "hover" && !button && <div className="card-hover-actions">{actionRow}</div>}
      </div>

      <div className="card-body flex flex-1 flex-col">
        {opts.show_brand && (product.brand?.name || product.category?.name) && (
          <p className="card-brand">{product.brand?.name || product.category?.name}</p>
        )}
        <h3 className="card-title">
          <Link href={href}>{product.name}</Link>
        </h3>
        {rating}
        {swatches.length > 0 && (
          <div className="card-swatches flex gap-1.5" aria-hidden>
            {swatches.map((c) => (
              <span key={c} className="h-3.5 w-3.5 rounded-full border border-[var(--color-border)]" style={{ backgroundColor: c }} />
            ))}
          </div>
        )}
        {priceRow}
        {stockLine}
        {(opts.add_to_cart === "button" || button) && <div className="card-actions-below mt-auto w-full">{actionRow}</div>}
      </div>

      {quickOpen && (
        <QuickView product={product} currency={currency} open={quickOpen} onClose={() => setQuickOpen(false)} />
      )}
    </div>
  );
}
