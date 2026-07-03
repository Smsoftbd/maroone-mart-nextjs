import { Phone, Truck } from "lucide-react";
import type { Product, Store, DeliveryCharge } from "@/lib/api/types";

interface ProductDetailsSectionsProps {
  product: Product;
  store: Store;
  deliveryCharges: DeliveryCharge[];
  currency: string;
}

function pickL10n(v: { en?: string; bn?: string; [k: string]: string | undefined } | undefined) {
  if (!v) return "";
  return v.en ?? Object.values(v).find(Boolean) ?? "";
}

export function ProductDetailsSections({
  product,
  store,
  deliveryCharges,
  currency,
}: ProductDetailsSectionsProps) {
  const specs = product.specifications ?? [];

  return (
    <div className="pt-3 lg:pt-6 pb-2 lg:pb-4 space-y-8">
      {/* Description */}
      {product.description && (
        <div className="description">
          <h4 className="text-2xl font-bold font-display text-surface-900 mb-3">
            Product Description
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
          <h4 className="text-2xl font-bold font-display text-surface-900 mb-3">
            Specifications
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
          <h4 className="text-2xl font-bold font-display text-surface-900 mb-3 flex items-center gap-2">
            <Truck className="h-6 w-6" /> Delivery Charges
          </h4>
          <ul className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-lg overflow-hidden">
            {deliveryCharges.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-4 py-3">
                <span className="font-medium text-surface-900">
                  {pickL10n(d.zone_name)}
                </span>
                <span className="font-semibold text-brand-500">
                  {currency}
                  {Number(d.charge_amount).toLocaleString("en-US")}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            📌 Delivery charges apply to all orders.
          </p>
        </div>
      )}

      {/* Contact */}
      {store.phone && (
        <div className="contact bg-amber-100 border border-amber-200 rounded-lg p-4 text-center">
          <h5 className="text-2xl font-bold font-display text-surface-900 mb-3">
            Contact for more details
          </h5>
          <p className="flex justify-center items-center gap-3">
            <span className="text-base text-surface-900">Call now:</span>
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
