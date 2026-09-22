import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./Spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

// Colors, hover effect (effects.button_hover), gradient and size
// (shape.button_size, for "md") come from the theme classes in globals.css.
const variants = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  // Promotions only (subscribe, claim offer) — at most one per screen.
  accent: "btn bg-tertiary-500 text-[var(--color-tertiary-text)] hover:bg-tertiary-600",
  ghost: "text-brand-ink hover:underline transition-colors",
  danger: "btn bg-red-600 text-[var(--color-status-error-text,#fff)] hover:opacity-90",
};

const sizes = {
  sm: "!min-h-0 px-3 py-1.5 text-sm",
  md: "text-sm",
  lg: "!min-h-0 px-6 py-3 text-base",
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
        "btn-shape inline-flex items-center justify-center gap-2 font-body",
        "disabled:cursor-not-allowed",
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
