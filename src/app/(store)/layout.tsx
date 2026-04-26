import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { PopupManager } from "@/components/home/PopupManager";
import { getStore } from "@/lib/api/store";
import { getCategories } from "@/lib/api/products";
import { getPages } from "@/lib/api/content";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store, categories, pages] = await Promise.all([
    getStore(),
    getCategories(),
    getPages(),
  ]);

  return (
    <>
      <AnnouncementBar message={store.offer_message} />
      <Navbar store={store} categories={categories} />
      <MobileNav store={store} categories={categories} />
      <CartDrawer currency={store.currency_symbol} />
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
    </>
  );
}
