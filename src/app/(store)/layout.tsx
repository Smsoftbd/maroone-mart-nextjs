import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingCart } from "@/components/cart/FloatingCart";
import { PopupManager } from "@/components/home/PopupManager";
import { getStore, getTranslations } from "@/lib/api/store";
import { getCategories } from "@/lib/api/products";
import { getPages } from "@/lib/api/content";
import { getLocale } from "@/lib/i18n/locale";
import { I18nProvider } from "@/lib/i18n/I18nProvider";

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

  return (
    <I18nProvider locale={locale} dict={dict}>
      <AnnouncementBar message={store.offer_message} />
      <Navbar store={store} categories={categories} />
      <MobileNav store={store} categories={categories} />
      <CartDrawer currency={store.currency_symbol} />
      <FloatingCart currency={store.currency_symbol} />
      <Suspense fallback={null}>
        <PopupManager />
      </Suspense>
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer store={store} pages={pages} />
      {store.scripts.footer && (
        <script dangerouslySetInnerHTML={{ __html: store.scripts.footer }} />
      )}
    </I18nProvider>
  );
}
