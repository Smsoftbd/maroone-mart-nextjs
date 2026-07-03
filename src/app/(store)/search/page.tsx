import { permanentRedirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

// Search merged into /products — redirect old URLs.
export default async function SearchPage({ searchParams }: PageProps) {
  const { q, page } = await searchParams;
  const params = new URLSearchParams();
  if (q) params.set("search", q);
  if (page) params.set("page", page);
  const query = params.toString();
  permanentRedirect(query ? `/products?${query}` : "/products");
}
