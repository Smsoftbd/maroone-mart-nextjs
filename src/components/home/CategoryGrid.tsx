import Image from "next/image";
import Link from "next/link";
import { getServerT } from "@/lib/i18n/server";
import type { HomepageCategory } from "@/lib/api/types";

interface CategoryGridProps {
  categories: HomepageCategory[];
}

/**
 * Homepage category tiles, like the Marooned storefront: four across, a 4:5
 * photo, the name in a small serif under it and an outlined "Shop Now".
 */
export async function CategoryGrid({ categories }: CategoryGridProps) {
  if (!categories.length) return null;
  const t = await getServerT();

  return (
    <section className="mr-cats">
      <div className="max-w-7xl mx-auto">
        <div className="mr-cat-grid">
          {categories.map((cat) => {
            const href = `/products?category=${cat.slug}`;
            return (
              <div key={cat.id} className="mr-cat group">
                <Link href={href} aria-label={cat.name} className="mr-cat-img">
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      width={400}
                      height={500}
                      sizes="(min-width: 1024px) 350px, 50vw"
                      className="h-full w-full object-cover object-top transition-transform duration-300 ease-in-out group-hover:scale-105"
                    />
                  ) : (
                    <span className="mr-cat-letter">{cat.name[0]}</span>
                  )}
                </Link>
                <div className="mr-cat-body">
                  <Link href={href}>
                    <h2 className="mr-cat-name">{cat.name}</h2>
                  </Link>
                  <Link href={href} aria-label={`Shop ${cat.name}`} className="mr-cat-btn">
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
