import { cn } from "@/lib/utils/cn";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-4",
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border-current border-t-transparent animate-spin",
        sizes[size],
        className
      )}
      aria-label="Loading"
      role="status"
    />
  );
}
