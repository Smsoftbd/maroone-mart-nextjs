/**
 * Storefront Appearance theme v4 (Admin → Ecommerce → Appearance).
 *
 * `GET /store` returns the resolved theme, a ready CSS block (`:root{…}` with
 * every token as a variable, the dark scheme blocks and the owner's custom
 * CSS), a Google Fonts URL and the `data-*` attributes for <body>. The root
 * layout inlines, in order:
 *   1. THEME_DEFAULTS_CSS: v4 variables with default values, so a v3 backend
 *      (which predates them) still renders every rule.
 *   2. THEME_BRIDGE_CSS: points the app's older variable names (brand-500,
 *      text-primary, Tailwind's slate/red scales …) at the theme tokens.
 *   3. The server CSS, last, so the owner's custom CSS wins.
 * Everything in 1–2 is `var()` based, so the dark scheme flows through.
 *
 * Choice tokens are normalized against DEFAULTS below: the app always sees a
 * complete theme, even from an older backend.
 */

import type { HomepageSection, StoreTheme } from "@/lib/api/types";
import { resolveL10n, type LocalizedString } from "@/lib/utils/l10n";

type Spec =
  | { kind: "enum"; def: string; opts: readonly string[] }
  | { kind: "num"; def: number; min: number; max: number }
  | { kind: "bool"; def: boolean }
  | { kind: "ratio"; def: string };

const oneOf = (...opts: string[]): Spec => ({ kind: "enum", def: opts[0], opts });
const num = (def: number, min: number, max: number): Spec => ({ kind: "num", def, min, max });
const bool = (def: boolean): Spec => ({ kind: "bool", def });

/** Choice tokens the app reads, with the backend's defaults (StorefrontTheme::schema). */
const SPEC: Record<keyof StoreTheme, Record<string, Spec>> = {
  layout: {
    container_width: num(1280, 320, 4000),
    container_padding: num(24, 0, 64),
    header_style: oneOf("classic", "centered", "minimal"),
    header_height: num(68, 40, 140),
    logo_height: num(36, 16, 100),
    sticky_header: bool(true),
    header_divider: oneOf("line", "none", "shadow"),
    nav_align: oneOf("left", "center"),
    cart_icon: oneOf("bag", "cart", "basket"),
    mobile_nav: oneOf("drawer", "bottom"),
    card_style: oneOf("bordered", "elevated", "flat"),
    image_ratio: { kind: "ratio", def: "1/1" },
    products_per_row: num(4, 3, 6),
    mobile_columns: num(2, 1, 2),
    grid_gap: num(18, 0, 60),
    filter_position: oneOf("left", "right", "drawer"),
    pagination: oneOf("numbers", "load_more", "infinite"),
    shop_banner: bool(true),
  },
  page: {
    announcement_bar: bool(true),
    announcement_style: oneOf("static", "marquee"),
    hero_style: oneOf("split", "split_reverse", "centered", "banner", "minimal"),
    hero_height: oneOf("md", "sm", "lg"),
    hero_align: oneOf("center", "start", "end"),
    category_style: oneOf("tile", "circle", "chip"),
    category_columns: num(6, 3, 8),
    section_spacing: oneOf("normal", "compact", "relaxed"),
    section_title_align: oneOf("left", "center"),
    section_title_decor: oneOf("none", "underline", "bar", "lines"),
    trust_bar: bool(true),
    newsletter_style: oneOf("card", "band", "minimal", "hidden"),
    page_pattern: oneOf("none", "dots", "grid", "glow"),
    breadcrumbs: bool(true),
    footer_style: oneOf("columns", "centered", "minimal"),
    footer_newsletter: bool(false),
    payment_icons: bool(true),
    back_to_top: bool(false),
  },
  product: {
    text_align: oneOf("left", "center"),
    title_lines: num(1, 1, 3),
    image_fit: oneOf("cover", "contain"),
    hover_image: bool(true),
    add_to_cart: oneOf("button", "icon", "hover", "hidden"),
    quick_view: bool(false),
    badge_position: oneOf("left", "right"),
    sale_display: oneOf("percent", "amount", "label"),
    rating_style: oneOf("stars", "compact"),
    show_brand: bool(false),
    show_swatches: bool(false),
    show_rating: bool(true),
    show_stock: bool(true),
    show_wishlist: bool(true),
    show_old_price: bool(true),
    gallery_layout: oneOf("thumbs_bottom", "thumbs_left", "grid"),
    info_layout: oneOf("tabs", "accordion", "stacked"),
    variant_style: oneOf("buttons", "pills", "dropdown"),
    sticky_cart: bool(true),
    show_trust: bool(true),
  },
  effects: {
    animation: oneOf("subtle", "none", "lively"),
    button_hover: oneOf("darken", "lift", "glow", "shine", "none"),
    card_hover: oneOf("border", "none", "lift", "zoom", "glow", "tilt"),
    gradient_buttons: bool(false),
    gradient_hero: bool(false),
    glass_header: bool(false),
    page_fade: bool(false),
    skeleton: oneOf("shimmer", "pulse", "none"),
    toast_position: oneOf("top-right", "top-center", "bottom-right", "bottom-center"),
    cart_feedback: oneOf("drawer", "toast", "bounce"),
  },
  dark: { mode: oneOf("off", "auto", "toggle") },
  typography: { link_underline: oneOf("none", "hover", "always") },
  shape: {
    button_size: oneOf("md", "sm", "lg"),
    input_style: oneOf("outlined", "filled", "underlined"),
    badge_style: oneOf("solid", "soft", "outline"),
  },
};

/** Body attribute → token path (StorefrontTheme::attributeMap). */
const ATTRIBUTE_MAP: Record<string, string> = {
  "data-header": "layout.header_style",
  "data-card": "layout.card_style",
  "data-nav-align": "layout.nav_align",
  "data-mobile-nav": "layout.mobile_nav",
  "data-sticky-header": "layout.sticky_header",
  "data-header-divider": "layout.header_divider",
  "data-cart-icon": "layout.cart_icon",
  "data-filters": "layout.filter_position",
  "data-pagination": "layout.pagination",
  "data-shop-banner": "layout.shop_banner",
  "data-announcement": "page.announcement_bar",
  "data-announcement-style": "page.announcement_style",
  "data-hero": "page.hero_style",
  "data-hero-height": "page.hero_height",
  "data-hero-align": "page.hero_align",
  "data-categories": "page.category_style",
  "data-spacing": "page.section_spacing",
  "data-title-align": "page.section_title_align",
  "data-title-decor": "page.section_title_decor",
  "data-trust-bar": "page.trust_bar",
  "data-newsletter": "page.newsletter_style",
  "data-pattern": "page.page_pattern",
  "data-breadcrumbs": "page.breadcrumbs",
  "data-footer": "page.footer_style",
  "data-footer-newsletter": "page.footer_newsletter",
  "data-payment-icons": "page.payment_icons",
  "data-back-to-top": "page.back_to_top",
  "data-card-align": "product.text_align",
  "data-image-fit": "product.image_fit",
  "data-add-to-cart": "product.add_to_cart",
  "data-badge-position": "product.badge_position",
  "data-sale-display": "product.sale_display",
  "data-show-rating": "product.show_rating",
  "data-show-stock": "product.show_stock",
  "data-show-wishlist": "product.show_wishlist",
  "data-show-old-price": "product.show_old_price",
  "data-hover-image": "product.hover_image",
  "data-quick-view": "product.quick_view",
  "data-rating-style": "product.rating_style",
  "data-show-brand": "product.show_brand",
  "data-show-swatches": "product.show_swatches",
  "data-gallery": "product.gallery_layout",
  "data-product-info": "product.info_layout",
  "data-variant-style": "product.variant_style",
  "data-sticky-cart": "product.sticky_cart",
  "data-product-trust": "product.show_trust",
  "data-button-size": "shape.button_size",
  "data-input-style": "shape.input_style",
  "data-badge-style": "shape.badge_style",
  "data-button-hover": "effects.button_hover",
  "data-card-hover": "effects.card_hover",
  "data-animation": "effects.animation",
  "data-gradient-buttons": "effects.gradient_buttons",
  "data-gradient-hero": "effects.gradient_hero",
  "data-glass-header": "effects.glass_header",
  "data-page-fade": "effects.page_fade",
  "data-skeleton": "effects.skeleton",
  "data-toast-position": "effects.toast_position",
  "data-cart-feedback": "effects.cart_feedback",
  "data-link-underline": "typography.link_underline",
  "data-color-scheme": "dark.mode",
};

const FONTS_ORIGIN = "https://fonts.googleapis.com/";
const ATTR_NAME = /^data-[a-z][a-z0-9-]{0,40}$/;
const ATTR_VALUE = /^[a-z0-9_-]{1,40}$/;

const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

function clean(spec: Spec, raw: unknown): unknown {
  switch (spec.kind) {
    case "enum":
      return spec.opts.includes(raw as string) ? raw : spec.def;
    case "num": {
      const n = Number(raw);
      return raw !== null && raw !== "" && Number.isFinite(n) && n >= spec.min && n <= spec.max ? n : spec.def;
    }
    case "bool":
      return typeof raw === "boolean" ? raw : spec.def;
    case "ratio":
      return typeof raw === "string" && /^\d+\/\d+$/.test(raw) ? raw : spec.def;
  }
}

/** Complete choice-token set; unknown or missing values fall back to the defaults. */
export function normalizeThemeTokens(raw: unknown): StoreTheme {
  const src = obj(raw);
  const out: Record<string, Record<string, unknown>> = {};
  for (const [group, fields] of Object.entries(SPEC)) {
    const g = obj(src[group]);
    out[group] = {};
    for (const [key, spec] of Object.entries(fields)) out[group][key] = clean(spec, g[key]);
  }
  return out as unknown as StoreTheme;
}

export const DEFAULT_THEME: StoreTheme = normalizeThemeTokens(null);

/** Body attributes from the tokens, then the server's own map (it may carry newer keys). */
function buildAttributes(theme: StoreTheme, server: unknown): Record<string, string> {
  const t = theme as unknown as Record<string, Record<string, unknown>>;
  const out: Record<string, string> = {};
  for (const [attr, path] of Object.entries(ATTRIBUTE_MAP)) {
    const [group, key] = path.split(".");
    const v = t[group]?.[key];
    out[attr] = typeof v === "boolean" ? String(v) : String(v ?? "");
  }
  for (const [k, v] of Object.entries(obj(server))) {
    if (ATTR_NAME.test(k) && typeof v === "string" && ATTR_VALUE.test(v)) out[k] = v;
  }
  return out;
}

export interface NormalizedTheme {
  theme: StoreTheme;
  theme_css: string | null;
  theme_fonts_url: string | null;
  theme_attributes: Record<string, string>;
}

/**
 * The CSS is server-validated; the `<` check only guarantees it cannot close
 * the `<style>` tag it is inlined into. Without usable CSS the default tokens
 * are still returned so layout choices keep working.
 */
export function normalizeTheme(
  theme: unknown,
  css: string | null | undefined,
  fontsUrl: string | null | undefined,
  attributes?: unknown
): NormalizedTheme {
  const tokens = normalizeThemeTokens(theme);
  const validCss =
    !!theme && typeof css === "string" && css.startsWith(":root{") && !css.includes("<");
  return {
    theme: tokens,
    theme_css: validCss ? css : null,
    theme_fonts_url:
      validCss && typeof fontsUrl === "string" && fontsUrl.startsWith(FONTS_ORIGIN) ? fontsUrl : null,
    theme_attributes: buildAttributes(tokens, validCss ? attributes : null),
  };
}

// ─── Homepage sections ──────────────────────────────────────────────────────

/** Order used when the backend predates `homepage_sections` (matches the old page). */
const LEGACY_ORDER = [
  "banner",
  "categories",
  "flash_sale",
  "top_selling",
  "featured_products",
  "new_arrivals",
  "reviews",
  "blog",
  "newsletter",
] as const;

const LIMITS: Record<string, [number, number, number]> = {
  categories: [12, 4, 24],
  reviews: [6, 3, 12],
  blog: [3, 2, 12],
};

function localized(raw: unknown, lang: string, fallbackLang: string): string | null {
  if (typeof raw === "string") return raw.trim() || null;
  const map = obj(raw);
  if (!Object.keys(map).length) return null;
  const text = resolveL10n(map as LocalizedString, lang) || resolveL10n(map as LocalizedString, fallbackLang);
  return text.trim() || null;
}

/**
 * Owner-ordered homepage blocks. Titles resolve to the visitor's language, then
 * the store default; null means "use the storefront's own translated title".
 */
export function normalizeHomepageSections(
  raw: unknown,
  legacy: Record<string, boolean | undefined> | undefined,
  lang: string,
  defaultLang: string
): HomepageSection[] {
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : LEGACY_ORDER.map((key) => ({ key, enabled: legacy?.[key] ?? true }));

  const seen = new Set<string>();
  const out: HomepageSection[] = [];
  for (const item of list) {
    const s = obj(item);
    const key = typeof s.key === "string" ? s.key : "";
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const [defLimit, min, max] = LIMITS[key] ?? [8, 4, 24];
    const limit = Number(s.limit);
    const interval = Number(s.interval);
    out.push({
      key,
      enabled: s.enabled !== false,
      title: localized(s.title, lang, defaultLang),
      subtitle: localized(s.subtitle, lang, defaultLang),
      limit: Number.isFinite(limit) && limit > 0 ? Math.min(max, Math.max(min, Math.round(limit))) : defLimit,
      layout: s.layout === "grid" || s.layout === "slider" ? s.layout : null,
      view_all: typeof s.view_all === "boolean" ? s.view_all : key !== "categories",
      autoplay: s.autoplay !== false,
      interval: Number.isFinite(interval) && interval >= 2 && interval <= 15 ? interval : 5,
      countdown: s.countdown !== false,
    });
  }
  return out;
}

// ─── CSS ────────────────────────────────────────────────────────────────────

/** Before the store CSS: v4 variables a v3 backend doesn't send yet. */
export const THEME_DEFAULTS_CSS =
  ":root{" +
  [
    "--typography-mobile-base-size:var(--typography-base-size,16px)",
    "--typography-heading-line-height:1.15",
    "--typography-body-tracking:0em",
    "--typography-heading-case:none",
    "--typography-button-case:none",
    "--typography-button-weight:600",
    "--typography-nav-case:none",
    "--typography-nav-weight:500",
    "--typography-price-weight:700",
    "--typography-price-numerals:tabular-nums",
    "--shape-section-radius:var(--shape-card-radius,12px)",
    "--shape-image-radius:var(--shape-card-radius,12px)",
    "--shape-badge-radius:999px",
    "--shape-button-border-width:var(--shape-border-width,1px)",
    "--shape-divider-style:solid",
    "--shape-focus-ring-width:3px",
    "--layout-container-width:1536px",
    "--layout-container-padding:24px",
    "--layout-header-height:72px",
    "--layout-logo-height:44px",
    "--layout-grid-gap:26px",
    "--page-category-columns:6",
    "--product-title-lines:1",
    "--effects-transition-speed:200ms",
    "--effects-lift-distance:4px",
    "--effects-zoom-scale:1.08",
    "--effects-glass-blur:12px",
    "--easing:cubic-bezier(.2,.7,.3,1)",
    "--font-price:var(--typography-body-font)",
    "--font-h4:calc(var(--typography-base-size,16px) * var(--typography-scale,1.25))",
    "--font-h3:calc(var(--font-h4) * var(--typography-scale,1.25))",
    "--font-h2:calc(var(--font-h3) * var(--typography-scale,1.25))",
    "--font-h1:calc(var(--font-h2) * var(--typography-scale,1.25))",
    "--color-brand-gradient-end:var(--color-brand-secondary)",
    "--gradient-brand:linear-gradient(135deg,var(--color-brand-primary),var(--color-brand-gradient-end))",
    "--color-commerce-sale-price:var(--color-commerce-price)",
    "--color-commerce-sold-out-badge-bg:var(--color-neutral-text-muted)",
    "--color-commerce-sold-out-badge-text:var(--color-neutral-background)",
    "--color-commerce-free-shipping:var(--color-status-success)",
    "--color-header-nav-hover:var(--color-header-nav-active)",
    "--color-section-hero-text:var(--color-neutral-text)",
    "--color-section-hero-overlay:rgba(0,0,0,.35)",
    "--color-section-trust-bar-bg:var(--color-neutral-surface)",
    "--color-section-trust-bar-icon:var(--color-brand-primary)",
    "--color-card-hover-shadow:color-mix(in srgb,var(--color-brand-primary) 30%,transparent)",
    "--color-misc-tooltip-bg:var(--color-neutral-text)",
    "--color-misc-tooltip-text:var(--color-neutral-background)",
  ].join(";") +
  "}";

/**
 * Restores the visitor's light/dark choice before first paint (inline in
 * <head>). Only rendered when dark mode isn't off.
 */
export const COLOR_SCHEME_SCRIPT =
  "try{var s=localStorage.getItem('theme');if(s==='light'||s==='dark')document.documentElement.dataset.theme=s}catch(e){}";

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
    // container_width is the *content* width: the gutters sit outside it.
    "--container-7xl": "calc(var(--layout-container-width, 1536px) + 2 * var(--layout-container-padding, 24px))",

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
