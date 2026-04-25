import { ProductCardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="flex gap-8">
        <aside className="hidden lg:block w-52 shrink-0 space-y-4">
          <Skeleton className="h-5 w-28" />
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </aside>
        <div className="flex-1">
          <div className="flex justify-between mb-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-40" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(24)].map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
