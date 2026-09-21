import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 lg:pt-6">
      <Skeleton className="h-3 w-56" />
      <div className="mt-4 lg:mt-6 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[72px_1fr] lg:gap-4">
          <div className="order-2 lg:order-1 flex lg:flex-col gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-16 h-20 lg:w-[72px] lg:h-[90px] rounded-lg" />
            ))}
          </div>
          <Skeleton className="order-1 lg:order-2 w-full aspect-[4/5] lg:aspect-auto lg:h-[min(40rem,calc(100vh-10rem))] rounded-2xl" />
        </div>
        <div className="lg:py-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-3 h-8 w-full" />
          <Skeleton className="mt-2 h-8 w-2/3" />
          <Skeleton className="mt-5 h-9 w-40" />
          <Skeleton className="mt-4 h-4 w-24" />
          <div className="mt-5 space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
          <Skeleton className="mt-8 h-10 w-3/4 rounded-full" />
          <div className="mt-6 flex gap-3">
            <Skeleton className="h-12 w-32 rounded-full" />
            <Skeleton className="h-12 flex-1 rounded-full" />
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
