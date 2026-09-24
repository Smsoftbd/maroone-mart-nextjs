import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCategories } from "@/lib/api/products";
import { getStore } from "@/lib/api/store";
import { generatePageMetadata } from "@/lib/utils/metadata";
import { getServerT } from "@/lib/i18n/server";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore();
  return generatePageMetadata({
    title: `All Categories — ${store.name}`,
    description: `Browse all product categories at ${store.name}`,
    url: "/categories",
  });
}

export default async function CategoriesPage() {
  const [categories, t] = await Promise.all([
    getCategories().catch(() => []),
    getServerT(),
  ]);

  return (
    <div className="bg-surface">
      <div className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb
            items={[
              { label: t("home", "Home"), href: "/" },
              { label: t("categories", "Categories") },
            ]}
          />
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <h1 className="mb-10 text-center text-2xl font-bold text-[var(--color-text-primary)] lg:mb-16 lg:text-4xl">
          {t("all_categories", "All Categories")}
        </h1>

        {categories.length === 0 ? (
          <EmptyState
            title={t("no_categories_found", "No categories found")}
            description={t("check_back_soon", "Check back soon.")}
          />
        ) : (
          <ul className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:gap-x-8 lg:grid-cols-6 lg:gap-x-12 lg:gap-y-12">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-3 text-center"
                >
                  <span className="flex aspect-[3/2] w-full items-center justify-center rounded-xl border border-slate-200 bg-surface transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-brand-500 group-hover:shadow-md">
                    {cat.image ? (
                      <span className="relative block h-1/2 w-1/2">
                        <Image
                          src={cat.image}
                          alt={cat.name}
                          fill
                          sizes="80px"
                          className="object-contain"
                        />
                      </span>
                    ) : (
                      <ImageOff className="h-7 w-7 text-slate-300" aria-hidden />
                    )}
                  </span>
                  <span className="line-clamp-3 max-w-[10rem] text-sm leading-relaxed text-slate-700 transition-colors group-hover:text-brand-ink sm:text-base lg:text-lg">
                    {cat.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
