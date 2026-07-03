import Image from "next/image";
import Link from "next/link";
import type { HomepageCategory } from "@/lib/api/types";

interface CategoryGridProps {
  categories: HomepageCategory[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (!categories.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h2 className="font-display text-2xl md:text-3xl font-semibold mb-6">
        Shop by Category
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-[var(--color-border)] hover:border-brand-400 hover:shadow-md transition-all bg-white"
          >
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-surface-50">
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="64px"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-brand-50 flex items-center justify-center">
                  <span className="text-brand-400 font-display font-bold text-xl">
                    {cat.name[0]}
                  </span>
                </div>
              )}
            </div>
            <span className="font-body text-xs font-medium text-center text-[var(--color-text-secondary)] group-hover:text-brand-500 transition-colors">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
