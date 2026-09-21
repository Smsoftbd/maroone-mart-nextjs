import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 lg:pt-10">
      <div className="mb-8 lg:mb-10">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-9 w-56" />
      </div>
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
        <Skeleton className="lg:hidden h-11 w-full" />
        <aside className="hidden lg:block w-60 shrink-0 space-y-6">
          <Skeleton className="h-5 w-24" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </aside>
        <div className="flex-1">
          <div className="hidden lg:flex justify-between pb-4 mb-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(12)].map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[3/4] w-full" rounded="sm" />
                <Skeleton className="mt-3 h-3.5 w-4/5" />
                <Skeleton className="mt-2 h-3.5 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
