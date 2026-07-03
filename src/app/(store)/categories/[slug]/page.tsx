import { permanentRedirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

// Categories merged into /products — redirect old URLs.
export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  const query = new URLSearchParams({ category: slug });
  if (page) query.set("page", page);
  permanentRedirect(`/products?${query.toString()}`);
}
