import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/api/content";
import { generatePageMetadata } from "@/lib/utils/metadata";

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const page = await getPage(slug);
    return generatePageMetadata({
      title: page.meta_title || page.title,
      description: page.meta_description || "",
      url: `/pages/${slug}`,
    });
  } catch {
    return {};
  }
}

export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params;
  let page;
  try {
    page = await getPage(slug);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display text-3xl font-bold mb-8">{page.title}</h1>
      <div
        className="prose-content text-[var(--color-text-secondary)]"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
