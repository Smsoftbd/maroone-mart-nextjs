import type { OrderDetail } from "@/lib/api/types";

/**
 * Variant chips for an order line: color swatch for "#hex" codes, else "Attribute: Value".
 * `attribute` is only present when the API eager-loads it, so fall back to the bare value.
 */
export function OrderItemVariants({ detail }: { detail: OrderDetail }) {
  const values = detail.barcode?.values;
  if (!values || values.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
      {values.map((v) => (
        <span key={v.id} className="flex items-center gap-1 text-[var(--color-text-muted)] text-xs">
          {v.code?.startsWith("#") ? (
            <>
              <span
                className="inline-block w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                style={{ backgroundColor: v.code }}
              />
              {v.value}
            </>
          ) : (
            <span>{v.attribute?.name ? `${v.attribute.name}: ${v.value}` : v.value}</span>
          )}
        </span>
      ))}
    </div>
  );
}
