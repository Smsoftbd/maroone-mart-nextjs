import type { Metadata } from "next";
import "./globals.css";
import { AuthInitializer } from "@/components/layout/AuthInitializer";
import { StoreConfigProvider } from "@/components/providers/StoreConfigProvider";
import { getStore } from "@/lib/api/store";
import { buildColorStyleBlock } from "@/lib/utils/colors";
import { COLOR_SCHEME_SCRIPT, THEME_BRIDGE_CSS, THEME_DEFAULTS_CSS } from "@/lib/utils/theme";
import { ThemeEffects } from "@/components/layout/ThemeEffects";
import { getLocale, isRtl } from "@/lib/i18n/locale";
import { MetaPixelBody, MetaPixelHead, isValidPixelId } from "@/components/analytics/MetaPixel";
import { GtmBody, GtmHead } from "@/components/analytics/Gtm";
import { getGtmConfig, isMetaViaSgtm, stripGtmSnippet } from "@/lib/analytics/gtm-config";
import { getDefaultConsent } from "@/lib/analytics/consent-server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore();
  return {
    title: {
      default: store.seo.meta_title ?? store.name,
      template: `%s | ${store.name}`,
    },
    description: store.seo.meta_description ?? store.tagline,
    icons: {
      icon: store.favicon || "/favicon.ico",
    },
    ...(store.tracking.fb_domain_verification_id && {
      other: { "facebook-domain-verification": store.tracking.fb_domain_verification_id },
    }),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store, locale, reqHeaders] = await Promise.all([getStore(), getLocale(), headers()]);
  // v4 defaults + bridge for older variable names, then the server theme CSS
  // (dark scheme + owner's custom CSS) last so it wins. Stores without a
  // theme fall back to the seven legacy colors.
  const themeStyle = store.theme_css
    ? THEME_DEFAULTS_CSS + THEME_BRIDGE_CSS + store.theme_css
    : buildColorStyleBlock(store.colors) + THEME_DEFAULTS_CSS;
  const colorScheme = store.theme_css ? store.theme.dark.mode : "off";
  const pixelId = isValidPixelId(store.tracking.fb_pixel_id) ? store.tracking.fb_pixel_id : null;
  const gtm = getGtmConfig();
  const headerScript = stripGtmSnippet(store.scripts.header, gtm?.id);
  const marketingDefault = getDefaultConsent(reqHeaders).marketing;

  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? "rtl" : "ltr"}
      className="h-full"
      // data-theme is set by COLOR_SCHEME_SCRIPT before hydration.
      suppressHydrationWarning
    >
      <head>
        {store.theme_fonts_url && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link rel="stylesheet" href={store.theme_fonts_url} />
          </>
        )}
        <style id="store-theme" dangerouslySetInnerHTML={{ __html: themeStyle }} />
        {colorScheme !== "off" && (
          <script dangerouslySetInnerHTML={{ __html: COLOR_SCHEME_SCRIPT }} />
        )}
        {gtm && <GtmHead config={gtm} />}
        {pixelId && (
          <MetaPixelHead
            pixelId={pixelId}
            marketingDefault={marketingDefault}
            relay={!isMetaViaSgtm()}
          />
        )}
        {headerScript && <script dangerouslySetInnerHTML={{ __html: headerScript }} />}
      </head>
      <body
        suppressHydrationWarning
        {...store.theme_attributes}
        data-color-scheme={colorScheme}
        className="min-h-full font-body text-[var(--color-text-primary)] bg-[var(--color-surface-0)]"
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-brand-500 focus:text-[var(--color-primary-text)] focus:px-4 focus:py-2 focus:rounded-lg"
        >
          Skip to content
        </a>
        {gtm && <GtmBody config={gtm} />}
        <AuthInitializer />
        {pixelId && <MetaPixelBody pixelId={pixelId} marketingDefault={marketingDefault} />}
        <StoreConfigProvider
          value={{
            authMode: store.auth_mode,
            guestCheckout: store.guest_checkout,
            checkoutOtp: store.checkout_otp,
            wishlist: store.features.wishlist,
            theme: store.theme,
          }}
        >
          {children}
          <ThemeEffects />
        </StoreConfigProvider>
      </body>
    </html>
  );
}
