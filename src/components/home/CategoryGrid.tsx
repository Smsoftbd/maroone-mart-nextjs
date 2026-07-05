import Image from "next/image";
import Link from "next/link";
import { getServerT } from "@/lib/i18n/server";
import type { HomepageCategory } from "@/lib/api/types";

interface CategoryGridProps {
  categories: HomepageCategory[];
}

export async function CategoryGrid({ categories }: CategoryGridProps) {
  if (!categories.length) return null;
  const t = await getServerT();

  return (
    <section className="banners py-14 bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 2xl:gap-8">
          {categories.map((cat) => {
            const href = `/products?category=${cat.slug}`;
            return (
              <div key={cat.id} className="group">
                <Link
                  href={href}
                  aria-label={cat.name}
                  className="banner-img block relative overflow-hidden rounded"
                >
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      width={400}
                      height={700}
                      className="w-full aspect-[4/5] object-cover object-top transition-transform duration-300 ease-in-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full aspect-[4/5] bg-brand-50 flex items-center justify-center">
                      <span className="font-display font-bold text-5xl text-brand-400">
                        {cat.name[0]}
                      </span>
                    </div>
                  )}
                </Link>
                <div className="content w-full text-center p-5">
                  <Link href={href}>
                    <h2 className="mb-4 text-sm font-thin font-serif hover:opacity-70 transition-opacity">
                      {cat.name}
                    </h2>
                  </Link>
                  <Link
                    href={href}
                    aria-label={`Shop ${cat.name}`}
                    className="inline-block border rounded px-4 py-2 font-semibold font-title transition-all duration-200 hover:opacity-80"
                    style={{
                      borderColor: "var(--color-text)",
                      color: "var(--color-text)",
                    }}
                  >
                    {t("shop_now", "Shop Now")}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
