import Image from "next/image";
import Link from "next/link";
import { Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatDate, truncate } from "@/lib/utils/format";
import type { BlogPost } from "@/lib/api/types";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="group bg-white rounded-xl border border-[var(--color-border)] overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/blog/${post.slug}`}>
        <div className="relative aspect-video overflow-hidden bg-surface-50">
          {post.featured_image && (
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="neutral">{post.category.name}</Badge>
        </div>
        <Link href={`/blog/${post.slug}`}>
          <h3 className="font-display font-semibold text-lg line-clamp-2 hover:text-brand-500 transition-colors mb-2">
            {post.title}
          </h3>
        </Link>
        {post.excerpt && (
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-3">
            {truncate(post.excerpt, 120)}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(post.published_at)}
          </span>
          {post.author && (
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {post.author}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
