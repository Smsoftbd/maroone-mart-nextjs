import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Calendar, User } from "lucide-react";
import { BlogContent } from "@/components/blog/BlogContent";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { getBlog } from "@/lib/api/content";
import { generatePageMetadata } from "@/lib/utils/metadata";
import { articleSchema } from "@/lib/utils/structured-data";
import { formatDate } from "@/lib/utils/format";
import { getLocale } from "@/lib/i18n/locale";

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getBlog(slug);
    return generatePageMetadata({
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || "",
      image: post.featured_image,
      url: `/blog/${slug}`,
      type: "article",
    });
  } catch {
    return {};
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  let post;
  try {
    post = await getBlog(slug);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: articleSchema(post) }}
      />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: post.title },
        ]}
      />

      <article className="mt-6">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4 text-sm text-[var(--color-text-muted)]">
            <span className="text-brand-ink font-medium">{post.category.name}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(post.published_at, locale)}
            </span>
            {post.author && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {post.author}
                </span>
              </>
            )}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-4 text-lg text-[var(--color-text-secondary)] leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </header>

        {post.featured_image && (
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-8">
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
            />
          </div>
        )}

        {post.content && <BlogContent content={post.content} />}
      </article>
    </div>
  );
}
