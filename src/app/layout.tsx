import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { AuthInitializer } from "@/components/layout/AuthInitializer";
import { StoreConfigProvider } from "@/components/providers/StoreConfigProvider";
import { getStore } from "@/lib/api/store";
import { buildColorStyleBlock } from "@/lib/utils/colors";
import { getLocale, isRtl } from "@/lib/i18n/locale";
import { MetaPixelBody, MetaPixelHead, isValidPixelId } from "@/components/analytics/MetaPixel";
import { GtmBody, GtmHead } from "@/components/analytics/Gtm";
import { getGtmConfig, stripGtmSnippet } from "@/lib/analytics/gtm-config";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

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
  const [store, locale] = await Promise.all([getStore(), getLocale()]);
  const colorStyle = buildColorStyleBlock(store.colors);
  const pixelId = isValidPixelId(store.tracking.fb_pixel_id) ? store.tracking.fb_pixel_id : null;
  const gtm = getGtmConfig();
  const headerScript = stripGtmSnippet(store.scripts.header, gtm?.id);

  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? "rtl" : "ltr"}
      className={`${playfair.variable} ${dmSans.variable} h-full`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: colorStyle }} />
        {gtm && <GtmHead config={gtm} />}
        {pixelId && <MetaPixelHead pixelId={pixelId} />}
        {headerScript && <script dangerouslySetInnerHTML={{ __html: headerScript }} />}
      </head>
      <body suppressHydrationWarning className="min-h-full font-body text-[var(--color-text-primary)] bg-[var(--color-surface-0)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-brand-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
        >
          Skip to content
        </a>
        {gtm && <GtmBody config={gtm} />}
        <AuthInitializer />
        {pixelId && <MetaPixelBody pixelId={pixelId} />}
        <StoreConfigProvider
          value={{
            authMode: store.auth_mode,
            guestCheckout: store.guest_checkout,
            checkoutOtp: store.checkout_otp,
          }}
        >
          {children}
        </StoreConfigProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
