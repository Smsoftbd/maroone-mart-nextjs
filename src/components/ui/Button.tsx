import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./Spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

const variants = {
  primary:
    "bg-brand-500 text-[var(--color-primary-text)] hover:bg-brand-600 active:scale-95 transition-all",
  secondary:
    "bg-secondary-500 text-[var(--color-secondary-text)] hover:bg-secondary-600 transition-colors",
  // Promotions only (subscribe, claim offer) — at most one per screen.
  accent:
    "bg-tertiary-500 text-[var(--color-tertiary-text)] hover:bg-tertiary-600 transition-colors",
  ghost: "text-brand-ink hover:underline transition-colors",
  danger: "bg-red-600 text-white hover:bg-red-700 transition-colors",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-5 py-2.5 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-body font-medium",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
