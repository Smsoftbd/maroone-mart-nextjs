import type { Metadata } from "next";
import { Zap } from "lucide-react";
import { Countdown } from "@/components/ui/Countdown";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductGrid } from "@/components/products/ProductGrid";
import { getFlashSales } from "@/lib/api/products";
import { getStore } from "@/lib/api/store";
import { generatePageMetadata } from "@/lib/utils/metadata";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore();
  return generatePageMetadata({
    title: `Hot Deals — ${store.name}`,
    description: `Limited-time flash sale deals at ${store.name}`,
    url: "/flash-sale",
  });
}

export default async function FlashSalePage() {
  const [store, sales] = await Promise.all([getStore(), getFlashSales()]);
  const currency = store.currency_symbol;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Hot Deals" }]} />

      {sales.length === 0 ? (
        <div className="text-center py-24 text-[var(--color-text-muted)]">
          No active deals right now. Check back soon.
        </div>
      ) : (
        sales.map((sale, i) => {
          const Heading = i === 0 ? "h1" : "h2";
          return (
          <section key={sale.id} className="mt-6 mb-12">
            <div className="bg-brand-500 text-white px-6 py-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 fill-current" />
                <div>
                  <Heading className="font-display text-2xl font-bold">{sale.title}</Heading>
                  <p className="text-sm opacity-80">
                    {sale.products.length} {sale.products.length === 1 ? "product" : "products"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest opacity-80 mb-1">Ends in</p>
                <Countdown endsAt={sale.ends_at} />
              </div>
            </div>
            <ProductGrid products={sale.products} currency={currency} />
          </section>
          );
        })
      )}
    </div>
  );
}
