import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductsLoading() {
  return (
    <div>
      <div className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="mb-5 h-5 w-36" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Skeleton className="h-[52px] w-full sm:w-60 lg:w-[210px]" />
          <Skeleton className="h-[52px] flex-1" />
        </div>
        <div className="product-grid gap-3 sm:gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="store-card p-1.5">
              <Skeleton className="aspect-product w-full" rounded="sm" />
              <Skeleton className="mt-3 h-3 w-1/3" />
              <Skeleton className="mt-2 h-3.5 w-4/5" />
              <Skeleton className="mt-2 h-3.5 w-1/2" />
              <Skeleton className="mt-3 h-9 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
