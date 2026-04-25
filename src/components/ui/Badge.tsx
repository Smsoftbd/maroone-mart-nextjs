import { cn } from "@/lib/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "brand" | "success" | "warning" | "error" | "neutral";
  className?: string;
}

const variants = {
  brand: "bg-brand-500 text-white",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
  neutral: "bg-surface-100 text-[var(--color-text-secondary)]",
};

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
