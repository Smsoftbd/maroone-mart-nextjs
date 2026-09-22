import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 lg:pt-6">
      <Skeleton className="h-3 w-56" />
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[64px_1fr]">
            <div className="order-2 lg:order-1 flex lg:flex-col gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="w-16 h-16 rounded-md" />
              ))}
            </div>
            <Skeleton className="order-1 lg:order-2 w-full aspect-square rounded-lg" />
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-3">
            <Skeleton className="h-11 rounded-md" />
            <Skeleton className="h-11 rounded-md" />
          </div>
        </div>
        <div>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-3/4" />
          <Skeleton className="mt-3 h-4 w-64" />
          <Skeleton className="mt-5 h-8 w-40" />
          <Skeleton className="mt-5 h-10 w-44 rounded-md" />
          <Skeleton className="mt-6 h-28 w-full rounded-lg" />
          <Skeleton className="mt-6 h-10 w-full" />
          <div className="mt-6 space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        </div>
      </div>
    </div>
  );
}
