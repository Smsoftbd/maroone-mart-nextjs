import { Skeleton } from "@/components/ui/Skeleton";

export default function OrdersLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-36" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border border-[var(--color-border)] rounded-xl p-4 space-y-3">
          <div className="flex justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-6 w-28" />
        </div>
      ))}
    </div>
  );
}
