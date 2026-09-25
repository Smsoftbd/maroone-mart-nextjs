import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingCart } from "@/components/cart/FloatingCart";
import { PopupManager } from "@/components/home/PopupManager";
import { ChatFab } from "@/components/layout/ChatFab";
import { getStore, getTranslations } from "@/lib/api/store";
import { getCategories } from "@/lib/api/products";
import { getPages } from "@/lib/api/content";
import { getLocale } from "@/lib/i18n/locale";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { getGtmConfig, stripGtmSnippet } from "@/lib/analytics/gtm-config";
import { getConsentBannerMode, getDefaultConsent } from "@/lib/analytics/consent-server";
import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { headers } from "next/headers";
import { messengerUrl } from "@/lib/utils/chat";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const [store, categories, pages, dict] = await Promise.all([
    getStore(),
    getCategories(),
    getPages(),
    getTranslations(locale),
  ]);
  const footerScript = stripGtmSnippet(store.scripts.footer, getGtmConfig()?.id);
  const consentMode = getConsentBannerMode();
  const defaultConsent = getDefaultConsent(await headers());

  return (
    <I18nProvider locale={locale} dict={dict}>
      <Navbar store={store} categories={categories} />
      <AnnouncementBar message={store.offer_message} />
      <MobileNav store={store} categories={categories} />
      <CartDrawer currency={store.currency_symbol} />
      <FloatingCart currency={store.currency_symbol} />
      <Suspense fallback={null}>
        <PopupManager />
      </Suspense>
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer store={store} pages={pages} categories={categories} />
      <ChatFab url={messengerUrl(store.social.facebook, store.social.whatsapp)} />
      <ScrollToTop />
      <BottomTabBar chatUrl={messengerUrl(store.social.facebook, store.social.whatsapp)} phone={store.phone} />
      {footerScript && <script dangerouslySetInnerHTML={{ __html: footerScript }} />}
      {consentMode !== "off" && (
        <ConsentBanner mode={consentMode} defaultConsent={defaultConsent} />
      )}
    </I18nProvider>
  );
}
