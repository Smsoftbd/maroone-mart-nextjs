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

const plain = (html?: string) => (html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/** "Collections": every category as a card with photo, name, blurb and a pink button. */
export default async function CategoriesPage() {
  const [categories, t] = await Promise.all([
    getCategories().catch(() => []),
    getServerT(),
  ]);
  const list = categories.filter((c) => c.slug !== "uncategorized");

  return (
    <div>
      <div className="max-w-7xl mx-auto pf-breadcrumb">
        <Breadcrumb
          items={[
            { label: t("home", "Home"), href: "/" },
            { label: t("collections", "Collections") },
          ]}
        />
      </div>

      <section className="max-w-7xl mx-auto pt-5 pb-20">
        <h1 className="pf-page-title mb-10">{t("collections", "Collections")}</h1>

        {list.length === 0 ? (
          <EmptyState
            title={t("no_categories_found", "No categories found")}
            description={t("check_back_soon", "Check back soon.")}
          />
        ) : (
          <ul className="pf-collections">
            {list.map((cat) => {
              const href = `/products?category=${cat.slug}`;
              const image = cat.image && !cat.image.includes("no_image") ? cat.image : null;
              const blurb = plain(cat.description);
              return (
                <li key={cat.id} className="pf-collection">
                  <Link href={href} className="pf-collection-img" aria-label={cat.name}>
                    {image ? (
                      <Image src={image} alt={cat.name} fill sizes="(min-width: 1024px) 280px, 50vw" className="object-cover" />
                    ) : (
                      <ImageOff className="h-8 w-8 text-[var(--color-text-muted)]" strokeWidth={1.25} aria-hidden />
                    )}
                  </Link>
                  <h2 className="pf-collection-title">
                    <Link href={href}>{cat.name}</Link>
                  </h2>
                  {cat.children?.length > 0 && (
                    <p className="pf-collection-count">
                      {t("x_collections", ":count collections").replace(":count", String(cat.children.length))}
                    </p>
                  )}
                  {blurb && <p className="pf-collection-text">{blurb}</p>}
                  <Link href={href} className="btn btn-primary pf-collection-btn">
                    {t("shop_this_collection", "Shop this collection")}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
