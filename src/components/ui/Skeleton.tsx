import { cn } from "@/lib/utils/cn";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
}

const radii = {
  sm: "rounded",
  md: "rounded-lg",
  lg: "rounded-xl",
  full: "rounded-full",
};

export function Skeleton({ className, rounded = "md" }: SkeletonProps) {
  return (
    <div
      className={cn("shimmer", radii[rounded], className)}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="store-card overflow-hidden">
      <Skeleton className="aspect-product w-full" rounded="sm" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}
