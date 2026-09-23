import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import type { Category } from "@/lib/api/types";

/**
 * Thumbnail for a category row; falls back to a lines icon when the category
 * has no image (the backend sends a generic no_image placeholder then).
 */
export function CategoryIcon({ image }: { image?: string | null }) {
  return image && !image.includes("no_image") ? (
    <Image
      src={image}
      alt=""
      width={22}
      height={22}
      className="h-[22px] w-[22px] shrink-0 rounded object-cover"
    />
  ) : (
    <Menu className="h-4 w-4 shrink-0 opacity-50" />
  );
}

/**
 * Homepage category column beside the hero banner — the same list the header's
 * "All categories" block drops down, shown inline like the reference storefront.
 */
export function HeroCategoryList({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <nav className="cat-list hero-cats hidden lg:block" aria-label="Categories">
      {categories.map((cat) => (
        <Link key={cat.id} href={`/products?category=${cat.slug}`}>
          <CategoryIcon image={cat.image} />
          <span className="truncate">{cat.name}</span>
        </Link>
      ))}
    </nav>
  );
}
