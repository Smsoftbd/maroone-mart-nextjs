import { Phone, Truck } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";
import { getLocale } from "@/lib/i18n/locale";
import { resolveL10n } from "@/lib/utils/l10n";
import type { Product, Store, DeliveryCharge } from "@/lib/api/types";

interface ProductDetailsSectionsProps {
  product: Product;
  store: Store;
  deliveryCharges: DeliveryCharge[];
  currency: string;
}

export async function ProductDetailsSections({
  product,
  store,
  deliveryCharges,
  currency,
}: ProductDetailsSectionsProps) {
  const [t, locale] = await Promise.all([getServerT(), getLocale()]);
  const specs = product.specifications ?? [];
  const hasAside = deliveryCharges.length > 0 || Boolean(store.phone);

  const nav = [
    product.description && { id: "product-description", label: t("description", "Description") },
    specs.length > 0 && { id: "product-specifications", label: t("specifications", "Specifications") },
    deliveryCharges.length > 0 && { id: "product-delivery", label: t("delivery", "Delivery") },
  ].filter((x): x is { id: string; label: string } => Boolean(x));

  if (nav.length === 0 && !hasAside) return null;

  return (
    <section className="mt-12 lg:mt-20">
      {/* Section nav */}
      {nav.length > 1 && (
        <nav className="sticky top-[3.25rem] lg:top-[7.5rem] z-10 -mx-4 px-4 sm:mx-0 sm:px-0 bg-[var(--color-surface-0)]/90 backdrop-blur border-b border-[var(--color-border)]">
          <ul className="flex gap-6 overflow-x-auto scrollbar-none">
            {nav.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  className="block whitespace-nowrap py-3.5 text-sm font-medium text-[var(--color-text-secondary)] border-b-2 border-transparent -mb-px hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-primary)] transition-colors"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div
        className={
          hasAside
            ? "mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16"
            : "mt-8"
        }
      >
        <div className="space-y-12 min-w-0">
          {/* Description */}
          {product.description && (
            <div id="product-description" className="scroll-mt-32 lg:scroll-mt-48">
              <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                {t("product_description", "Product Description")}
              </h2>
              <div
                className="prose-content max-w-3xl text-[15px] leading-relaxed text-[var(--color-text-secondary)] [&_img]:rounded-xl [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}

          {/* Specifications */}
          {specs.length > 0 && (
            <div id="product-specifications" className="scroll-mt-32 lg:scroll-mt-48">
              <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                {t("specifications", "Specifications")}
              </h2>
              <dl className="max-w-3xl divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] overflow-hidden text-sm">
                {specs.map((spec, i) => (
                  <div key={i} className="grid grid-cols-[minmax(8rem,35%)_1fr] gap-4 px-5 py-3.5 odd:bg-surface-50">
                    <dt className="text-[var(--color-text-secondary)]">{spec.label}</dt>
                    <dd className="font-medium text-[var(--color-text-primary)]">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {hasAside && (
          <aside className="space-y-4 lg:sticky lg:top-48 lg:self-start">
            {/* Delivery charges */}
            {deliveryCharges.length > 0 && (
              <div id="product-delivery" className="scroll-mt-32 lg:scroll-mt-48 rounded-2xl border border-[var(--color-border)] p-5">
                <h2 className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
                  <Truck className="h-5 w-5" strokeWidth={1.5} />
                  {t("delivery_charges", "Delivery Charges")}
                </h2>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {deliveryCharges.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-4">
                      <span className="text-[var(--color-text-secondary)]">
                        {resolveL10n(d.zone_name, locale)}
                      </span>
                      <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                        {currency}
                        {Number(d.charge_amount).toLocaleString("en-US")}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 pt-4 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
                  {t("delivery_charges_note", "Delivery charges apply to all orders.")}
                </p>
              </div>
            )}

            {/* Contact */}
            {store.phone && (
              <a
                href={`tel:${store.phone}`}
                className="group flex items-center gap-4 rounded-2xl border border-[var(--color-border)] p-5 transition-colors hover:border-[var(--color-text-primary)]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[var(--color-primary-text)]">
                  <Phone className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs text-[var(--color-text-secondary)]">
                    {t("contact_for_details", "Contact for more details")}
                  </span>
                  <span className="block text-lg font-semibold text-[var(--color-text-primary)] tabular-nums">
                    {store.phone}
                  </span>
                </span>
              </a>
            )}
          </aside>
        )}
      </div>
    </section>
  );
}
