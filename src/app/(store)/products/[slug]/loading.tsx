import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Skeleton className="h-4 w-64 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        <div className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-16 h-16 rounded-lg" />)}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <div className="space-y-2 pt-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        </div>
      </div>
    </div>
  );
}
