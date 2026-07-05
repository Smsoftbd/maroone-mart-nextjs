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

  return (
    <div className="pt-3 lg:pt-6 pb-2 lg:pb-4 space-y-8">
      {/* Description */}
      {product.description && (
        <div className="description">
          <h4 className="text-2xl font-bold font-display text-[var(--color-text-primary)] mb-3">
            {t("product_description", "Product Description")}
          </h4>
          <div
            className="prose-content max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      {/* Specifications */}
      {specs.length > 0 && (
        <div id="product-specifications">
          <h4 className="text-2xl font-bold font-display text-[var(--color-text-primary)] mb-3">
            {t("specifications", "Specifications")}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-[var(--color-border)]">
                {specs.map((spec, i) => (
                  <tr key={i}>
                    <td className="py-3 pr-6 font-medium text-[var(--color-text-secondary)] w-40">
                      {spec.label}
                    </td>
                    <td className="py-3">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delivery charges */}
      {deliveryCharges.length > 0 && (
        <div>
          <h4 className="text-2xl font-bold font-display text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
            <Truck className="h-6 w-6" /> {t("delivery_charges", "Delivery Charges")}
          </h4>
          <ul className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-lg overflow-hidden">
            {deliveryCharges.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-4 py-3">
                <span className="font-medium text-[var(--color-text-primary)]">
                  {resolveL10n(d.zone_name, locale)}
                </span>
                <span className="font-semibold text-brand-500">
                  {currency}
                  {Number(d.charge_amount).toLocaleString("en-US")}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            📌 {t("delivery_charges_note", "Delivery charges apply to all orders.")}
          </p>
        </div>
      )}

      {/* Contact */}
      {store.phone && (
        <div className="contact bg-amber-100 border border-amber-200 rounded-lg p-4 text-center">
          <h5 className="text-2xl font-bold font-display text-[var(--color-text-primary)] mb-3">
            {t("contact_for_details", "Contact for more details")}
          </h5>
          <p className="flex justify-center items-center gap-3">
            <span className="text-base text-[var(--color-text-primary)]">{t("call_now", "Call now")}:</span>
            <a
              href={`tel:${store.phone}`}
              className="inline-flex items-center gap-2 text-2xl font-bold font-display text-brand-500"
            >
              <Phone className="h-5 w-5" />
              {store.phone}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
