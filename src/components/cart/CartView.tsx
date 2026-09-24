"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ShieldCheck, ShoppingBag } from "lucide-react";
import { CartItem } from "./CartItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCartStore } from "@/lib/stores/cartStore";
import { useTrackViewCart } from "@/lib/hooks/useTrackViewCart";
import { formatPrice } from "@/lib/utils/format";
import { useT } from "@/lib/i18n/I18nProvider";

export const CART_NOTE_KEY = "cart-note";

export interface ShippingRate {
  name: string;
  amount: number;
}

interface CartViewProps {
  currency: string;
  country: string;
  rates: ShippingRate[];
}

/**
 * Cart page, like the reference storefront: grey "Product(s)" panel of line
 * items on the left; on the right a "Subtotal" panel (amount, order note,
 * checkout button) and a "Get shipping estimates" panel.
 */
export function CartView({ currency, country, rates }: CartViewProps) {
  const t = useT();
  const { items, subTotal } = useCartStore();
  useTrackViewCart(true);
  const [note, setNote] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_NOTE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from storage after mount
      if (saved) setNote(saved);
    } catch {}
  }, []);
  const [showRates, setShowRates] = useState(false);

  const saveNote = (value: string) => {
    setNote(value);
    try {
      localStorage.setItem(CART_NOTE_KEY, value);
    } catch {}
  };

  return (
    <>
      <div className="cart-head">
        <h1 className="pf-page-title">{t("your_cart", "Your Cart")}</h1>
        <Link href="/products" className="cart-continue">
          {t("continue_shopping", "Continue Shopping")}
          <ChevronRight className="h-3 w-3" strokeWidth={2} />
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={t("cart_empty", "Your cart is empty")}
          description={t("cart_empty_hint", "Discover our products and add something you love.")}
          action={{ label: t("start_shopping", "Start Shopping"), href: "/products" }}
        />
      ) : (
        <div className="cart-layout">
          <div className="min-w-0">
            <div className="cart-panel">
              <p className="cart-panel-title is-left">{t("products_heading", "Product(s)")}</p>
              <div className="cart-page-list">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} currency={currency} />
                ))}
              </div>
            </div>
            <p className="cart-secure">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />
              {t("secure_shopping_guarantee", "Secure Shopping Guarantee.")}
            </p>
          </div>

          <aside className="cart-side">
            <div className="cart-panel">
              <p className="cart-panel-title">{t("subtotal", "Subtotal")}</p>
              <div className="cart-panel-box">
                <p className="cart-subtotal">{formatPrice(subTotal, currency)}</p>
                <label htmlFor="cart-note" className="cart-note-label">
                  <span className="cart-note-badge">{t("note", "Note")}</span>
                  {t("additional_comments", "Additional comments")}
                </label>
                <textarea
                  id="cart-note"
                  value={note}
                  onChange={(e) => saveNote(e.target.value)}
                  className="cart-note"
                  rows={4}
                />
                <Link href="/checkout" className="cart-checkout-btn">
                  {t("proceed_to_checkout", "Proceed to checkout")}
                </Link>
              </div>
            </div>

            <div className="cart-panel">
              <p className="cart-panel-title">{t("get_shipping_estimates", "Get shipping estimates")}</p>
              <div className="cart-panel-box">
                <label className="cart-field-label" htmlFor="cart-country">
                  {t("country", "Country")}
                </label>
                <span className="shop-toolbar-select w-full">
                  <select id="cart-country" defaultValue={country}>
                    <option value={country}>{country}</option>
                  </select>
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
                </span>
                <label className="cart-field-label" htmlFor="cart-zip">
                  {t("postal_code", "Postal/Zip Code")}
                </label>
                <input id="cart-zip" className="cart-input" autoComplete="postal-code" />
                <button type="button" className="cart-calc-btn" onClick={() => setShowRates(true)}>
                  {t("calculate_shipping", "Calculate shipping")}
                </button>
                {showRates && (
                  <div className="cart-rates">
                    {rates.length === 0 ? (
                      <p>{t("shipping_at_checkout", "Shipping calculated at checkout.")}</p>
                    ) : (
                      <>
                        <p>
                          {t("shipping_rates_found", "There are :count shipping rates available:").replace(
                            ":count",
                            String(rates.length)
                          )}
                        </p>
                        <ul>
                          {rates.map((r) => (
                            <li key={r.name}>
                              {r.name}: <strong>{formatPrice(r.amount, currency)}</strong>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
