export function formatPrice(
  amount: number,
  currencySymbol = "৳"
): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${currencySymbol}${formatted}`;
}

export function formatDiscount(
  original: number,
  discounted: number
): string {
  if (original <= 0) return "0";
  const pct = ((original - discounted) / original) * 100;
  return String(Math.round(pct));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
