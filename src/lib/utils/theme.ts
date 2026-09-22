/**
 * Storefront Appearance theme (Admin → Ecommerce → Appearance).
 *
 * The API returns ~137 resolved tokens plus a ready `:root{…}` block
 * (`--color-header-bg`, `--shape-card-radius`, `--layout-products-per-row` …)
 * and a Google Fonts URL. The root layout inlines that block, then
 * THEME_BRIDGE_CSS, which points the app's older variable names (brand-500,
 * text-primary, surface-0, Tailwind's slate/red/green scales, radius and
 * container scales) at the new tokens so every component follows the theme.
 *
 * When the backend sends no theme, the legacy seven-color block from
 * `buildColorStyleBlock()` is used instead.
 */

import type { CardStyle, HeaderStyle, StoreTheme, StoreThemeLayout } from "@/lib/api/types";

export const DEFAULT_LAYOUT: StoreThemeLayout = {
  container_width: 1280,
  header_style: "classic",
  sticky_header: true,
  card_style: "bordered",
  image_ratio: "1/1",
  products_per_row: 4,
  mobile_columns: 2,
};

const HEADER_STYLES: HeaderStyle[] = ["classic", "centered", "minimal"];
const CARD_STYLES: CardStyle[] = ["bordered", "elevated", "flat"];
const FONTS_ORIGIN = "https://fonts.googleapis.com/";

function pick<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function int(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
}

function normalizeLayout(raw: unknown): StoreThemeLayout {
  const l = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_LAYOUT;
  return {
    container_width: int(l.container_width, 320, 4000, d.container_width),
    header_style: pick(l.header_style, HEADER_STYLES, d.header_style),
    sticky_header: typeof l.sticky_header === "boolean" ? l.sticky_header : d.sticky_header,
    card_style: pick(l.card_style, CARD_STYLES, d.card_style),
    image_ratio:
      typeof l.image_ratio === "string" && /^\d+\/\d+$/.test(l.image_ratio) ? l.image_ratio : d.image_ratio,
    products_per_row: int(l.products_per_row, 3, 6, d.products_per_row),
    mobile_columns: int(l.mobile_columns, 1, 2, d.mobile_columns),
  };
}

/**
 * Keep the theme only when it is complete enough to render. The CSS is
 * server-validated; the `<` check just guarantees it cannot close the
 * `<style>` tag it is inlined into.
 */
export function normalizeTheme(
  theme: unknown,
  css: string | null | undefined,
  fontsUrl: string | null | undefined
): { theme: StoreTheme | null; theme_css: string | null; theme_fonts_url: string | null } {
  const validCss = typeof css === "string" && css.startsWith(":root{") && !css.includes("<");
  if (!theme || typeof theme !== "object" || !validCss) {
    return { theme: null, theme_css: null, theme_fonts_url: null };
  }
  return {
    theme: { ...(theme as Record<string, unknown>), layout: normalizeLayout((theme as StoreTheme).layout) },
    theme_css: css,
    theme_fonts_url: typeof fontsUrl === "string" && fontsUrl.startsWith(FONTS_ORIGIN) ? fontsUrl : null,
  };
}

/** `color-mix` of a token into the page background (works for dark themes too). */
const tint = (token: string, pct: number) =>
  `color-mix(in srgb,var(${token}) ${pct}%,var(--color-neutral-background))`;
/** Deeper shade for text on a tint: the status color pulled toward body text. */
const deep = (token: string) => `color-mix(in srgb,var(${token}) 70%,var(--color-neutral-text))`;

/** Tailwind palette step → how strongly the status color is mixed into the page. */
function statusScale(names: string[], token: string): Record<string, string> {
  const steps: [number, string][] = [
    [50, tint(token, 8)],
    [100, tint(token, 14)],
    [200, tint(token, 25)],
    [300, tint(token, 40)],
    [400, tint(token, 75)],
    [500, `var(${token})`],
    [600, `var(${token})`],
    [700, `var(${token})`],
    [800, deep(token)],
    [900, deep(token)],
  ];
  const out: Record<string, string> = {};
  for (const name of names) for (const [step, value] of steps) out[`--color-${name}-${step}`] = value;
  return out;
}

function buildBridge(): string {
  const vars: Record<string, string> = {
    // Legacy doc tokens
    "--color-primary": "var(--color-brand-primary)",
    "--color-primary-text": "var(--color-brand-primary-text)",
    "--color-primary-hover": "var(--color-button-primary-hover-bg)",
    "--color-primary-soft": tint("--color-brand-primary", 10),
    "--color-secondary": "var(--color-brand-secondary)",
    "--color-secondary-text": "var(--color-brand-secondary-text)",
    "--color-secondary-hover": "var(--color-button-secondary-hover-bg)",
    "--color-secondary-soft": tint("--color-brand-secondary", 10),
    "--color-tertiary": "var(--color-brand-tertiary)",
    "--color-tertiary-text": "var(--color-brand-tertiary-text)",
    "--color-tertiary-hover": "color-mix(in srgb,var(--color-brand-tertiary) 85%,#000)",
    "--color-tertiary-soft": tint("--color-brand-tertiary", 10),
    "--color-tertiary-ink": "var(--color-commerce-rating-star)",
    "--color-text": "var(--color-neutral-text)",
    "--color-link": "var(--color-misc-link)",
    "--color-surface": "var(--color-neutral-surface)",
    "--color-footer": "var(--color-footer-bg)",

    // Tailwind theme keys used across components
    "--color-brand-50": tint("--color-brand-primary", 6),
    "--color-brand-100": tint("--color-brand-primary", 10),
    "--color-brand-500": "var(--color-brand-primary)",
    "--color-brand-600": "var(--color-button-primary-hover-bg)",
    "--color-brand-ink": "var(--color-misc-link)",
    "--color-brand-strong": "var(--color-commerce-price)",
    "--color-secondary-50": tint("--color-brand-secondary", 8),
    "--color-secondary-500": "var(--color-brand-secondary)",
    "--color-secondary-600": "var(--color-button-secondary-hover-bg)",
    "--color-secondary-ink": "var(--color-section-section-link)",
    "--color-tertiary-50": tint("--color-brand-tertiary", 8),
    "--color-tertiary-500": "var(--color-brand-tertiary)",
    "--color-tertiary-600": "color-mix(in srgb,var(--color-brand-tertiary) 85%,#000)",

    // Neutrals
    "--color-text-primary": "var(--color-neutral-text)",
    "--color-text-secondary": "var(--color-neutral-text-secondary)",
    "--color-text-muted": "var(--color-neutral-text-muted)",
    "--color-border": "var(--color-neutral-border)",
    "--color-border-dark": "var(--color-neutral-border-strong)",
    "--color-surface-0": "var(--color-neutral-background)",
    "--color-surface-50": "color-mix(in srgb,var(--color-neutral-surface-alt) 50%,var(--color-neutral-surface))",
    "--color-surface-100": "var(--color-neutral-surface-alt)",
    "--color-surface-900": "var(--color-neutral-text)",
    "--color-success": "var(--color-status-success)",
    "--color-warning": "var(--color-status-warning)",
    "--color-error": "var(--color-status-error)",

    // Shape: Tailwind's radius scale follows the theme's base radius
    "--radius-xs": "calc(var(--shape-radius) * 0.25)",
    "--radius-sm": "calc(var(--shape-radius) * 0.4)",
    "--radius": "calc(var(--shape-radius) * 0.4)",
    "--radius-md": "calc(var(--shape-radius) * 0.6)",
    "--radius-lg": "calc(var(--shape-radius) * 0.8)",
    "--radius-xl": "calc(var(--shape-radius) * 1.2)",
    "--radius-2xl": "calc(var(--shape-radius) * 1.6)",
    "--radius-3xl": "calc(var(--shape-radius) * 2.4)",

    // Layout: every `max-w-7xl` wrapper uses the theme's container width
    "--container-7xl": "var(--layout-container-width)",

    // Fonts
    "--font-display": "var(--typography-heading-font)",
    "--font-body": "var(--typography-body-font)",

    ...statusScale(["red", "rose"], "--color-status-error"),
    ...statusScale(["green", "emerald"], "--color-status-success"),
    ...statusScale(["yellow", "amber", "orange"], "--color-status-warning"),
    ...statusScale(["blue", "sky"], "--color-status-info"),
  };

  // Tailwind's slate/neutral greys, mixed from the body text into the page.
  const greys: [number, number][] = [
    [50, 3], [100, 5], [200, 10], [300, 18], [400, 40],
    [500, 55], [600, 68], [700, 80], [800, 90], [900, 100], [950, 100],
  ];
  for (const [step, pct] of greys) {
    const value = pct === 100 ? "var(--color-neutral-text)" : tint("--color-neutral-text", pct);
    vars[`--color-slate-${step}`] = value;
    vars[`--color-neutral-${step}`] = value;
    vars[`--color-gray-${step}`] = value;
  }

  return `:root{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";")}}`;
}

/** Static: maps legacy variable names onto the Appearance tokens. */
export const THEME_BRIDGE_CSS = buildBridge();
