/**
 * Storefront theme. The admin (Ecommerce Setting → Appearance) stores seven
 * colors as background/text pairs; everything else is derived here and
 * emitted once on :root so first paint is already themed.
 *
 * Roles:
 * - primary   → header, main CTAs (Buy Now, Add to Cart on cards, checkout), active states
 * - secondary → one bold band (popular categories), video banner, second actions, "Best Seller" badges
 * - tertiary  → small highlights only: announcement bar, sale tags, cart count, stars, newsletter button
 * - default   → body text on the white page; all neutrals are mixed from it,
 *               and the footer ground (a dark ink derived from it)
 *
 * Page stays mostly white: saturated colors are kept to CTAs, prices, badges
 * and one band; large areas use the `*-soft` tints.
 *
 * A `*_text` color is only ever used on top of its matching background.
 */

export interface StoreColors {
  primary: string;
  primary_text: string;
  secondary: string;
  secondary_text: string;
  tertiary: string;
  tertiary_text: string;
  default_text: string;
}

/** Matches the database column defaults; used when a value is null or malformed. */
export const DEFAULT_COLORS: StoreColors = {
  primary: "#007bff",
  primary_text: "#ffffff",
  secondary: "#6c757d",
  secondary_text: "#ffffff",
  tertiary: "#28a745",
  tertiary_text: "#ffffff",
  default_text: "#000000",
};

const HEX = /^#[0-9a-f]{6}$/i;
const WHITE = "#ffffff";

/** Validate every value against #rrggbb; anything else falls back to the default. */
export function normalizeColors(colors?: Partial<Record<keyof StoreColors, string | null>> | null): StoreColors {
  const out = { ...DEFAULT_COLORS };
  for (const key of Object.keys(DEFAULT_COLORS) as (keyof StoreColors)[]) {
    const value = colors?.[key];
    if (typeof value === "string" && HEX.test(value)) out[key] = value.toLowerCase();
  }
  return out;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: number[]): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

/** Same as CSS `color-mix(in srgb, a pct%, b)`. */
function mix(a: string, b: string, pct: number): string {
  const ca = hexToRgb(a), cb = hexToRgb(b);
  const w = pct / 100;
  return rgbToHex(ca.map((v, i) => v * w + cb[i] * (1 - w)));
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio — same formula as the admin's Readability check. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Use `color` on `bg` when readable (≥ 4.5:1 text, ≥ 3:1 icons); otherwise `fallback`. */
export function accessibleOn(color: string, bg: string, fallback: string, min = 4.5): string {
  return contrast(color, bg) >= min ? color : fallback;
}

/** Guard against a hand-set `*_text` that is unreadable on its background. */
function textOn(bg: string, preferred: string): string {
  if (contrast(bg, preferred) >= 3) return preferred;
  return contrast(bg, WHITE) >= contrast(bg, "#111111") ? WHITE : "#111111";
}

/** Darken `hex` toward black (keeping its hue) until it reads on white at `min`. */
function inkOnWhite(hex: string, min = 4.5): string {
  for (let pct = 100; pct >= 0; pct -= 5) {
    const shade = mix(hex, "#000000", pct);
    if (contrast(shade, WHITE) >= min) return shade;
  }
  return "#000000";
}

/** Hover shade: 85% toward black, or toward white for near-black colors. */
function hover(hex: string): string {
  return luminance(hex) < 0.02 ? mix(hex, WHITE, 80) : mix(hex, "#000000", 85);
}

export function buildColorStyleBlock(input?: Partial<Record<keyof StoreColors, string | null>> | null): string {
  const c = normalizeColors(input);
  const text = accessibleOn(c.default_text, WHITE, "#000000");
  const link = inkOnWhite(c.primary);
  // Footer ground: the text color when it is dark enough, else a slate navy.
  const footer = luminance(text) < 0.03 ? text : "#0f172a";

  const vars: Record<string, string> = {
    // Tokens from the API (doc names)
    "--color-primary": c.primary,
    "--color-primary-text": textOn(c.primary, c.primary_text),
    "--color-secondary": c.secondary,
    "--color-secondary-text": textOn(c.secondary, c.secondary_text),
    "--color-tertiary": c.tertiary,
    "--color-tertiary-text": textOn(c.tertiary, c.tertiary_text),
    "--color-text": text,

    // Derived — never stored
    "--color-primary-hover": hover(c.primary),
    "--color-primary-soft": mix(c.primary, WHITE, 10),
    "--color-secondary-hover": hover(c.secondary),
    "--color-secondary-soft": mix(c.secondary, WHITE, 10),
    "--color-tertiary-hover": hover(c.tertiary),
    "--color-tertiary-soft": mix(c.tertiary, WHITE, 10),
    "--color-link": link,
    // Stars and small icons on white: 3:1 is enough for non-text.
    "--color-tertiary-ink": accessibleOn(c.tertiary, WHITE, text, 3),
    "--color-surface": WHITE,
    "--color-footer": footer,
    "--color-footer-text": WHITE,

    // Tailwind theme keys (bg-brand-500, text-brand-ink, bg-secondary-500, bg-tertiary-500 …)
    "--color-brand-50": mix(c.primary, WHITE, 6),
    "--color-brand-100": mix(c.primary, WHITE, 10),
    "--color-brand-500": c.primary,
    "--color-brand-600": hover(c.primary),
    "--color-brand-ink": link,
    // Bold prices/large numbers: 3:1 keeps them closer to the raw primary.
    "--color-brand-strong": inkOnWhite(c.primary, 3),
    "--color-secondary-500": c.secondary,
    "--color-secondary-600": hover(c.secondary),
    "--color-secondary-50": mix(c.secondary, WHITE, 8),
    "--color-secondary-ink": inkOnWhite(c.secondary),
    "--color-tertiary-50": mix(c.tertiary, WHITE, 8),
    "--color-tertiary-500": c.tertiary,
    "--color-tertiary-600": hover(c.tertiary),

    // Neutrals mixed from the text color so they stay in tune with warm/cool palettes
    "--color-text-primary": text,
    "--color-text-secondary": mix(text, WHITE, 75),
    "--color-text-muted": mix(text, WHITE, 60),
    "--color-border": mix(text, WHITE, 10),
    "--color-border-dark": mix(text, WHITE, 18),
    "--color-surface-0": WHITE,
    "--color-surface-50": mix(text, WHITE, 2),
    "--color-surface-100": mix(text, WHITE, 4),
    "--color-surface-900": text,
  };

  // Remap Tailwind's slate/neutral greys onto the text color too.
  const scale: [number, number][] = [
    [50, 3], [100, 5], [200, 10], [300, 18], [400, 40],
    [500, 55], [600, 68], [700, 80], [800, 90], [900, 100], [950, 100],
  ];
  for (const [step, pct] of scale) {
    const value = mix(text, WHITE, pct);
    vars[`--color-slate-${step}`] = value;
    vars[`--color-neutral-${step}`] = value;
  }

  const block = Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  return `:root{${block}}`;
}
