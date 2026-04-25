import type { Metadata } from "next";
import { Suspense } from "react";
import { BlogCard } from "@/components/blog/BlogCard";
import { Pagination } from "@/components/ui/Pagination";
import { getBlogs } from "@/lib/api/content";
import { getStore } from "@/lib/api/store";
import { generatePageMetadata } from "@/lib/utils/metadata";

export const revalidate = 3600;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore();
  return generatePageMetadata({
    title: `Blog — ${store.name}`,
    description: `Latest news and articles from ${store.name}`,
    url: "/blog",
  });
}

export default async function BlogPage({ searchParams }: PageProps) {
  const { page = "1" } = await searchParams;
  const { data: posts, meta } = await getBlogs({ page: Number(page), per_page: 12 });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-3xl font-bold mb-8">Blog</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
      <Suspense fallback={null}>
        <Pagination
          currentPage={meta.current_page}
          lastPage={meta.last_page}
          total={meta.total}
        />
      </Suspense>
    </div>
  );
}
