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
    "bg-[var(--color-button-primary-bg,var(--color-brand-500))] text-[var(--color-button-primary-text,var(--color-primary-text))] border-[color:var(--color-button-primary-border,transparent)] hover:bg-[var(--color-button-primary-hover-bg,var(--color-brand-600))] active:scale-95 transition-all",
  secondary:
    "bg-[var(--color-button-secondary-bg,var(--color-secondary-500))] text-[var(--color-button-secondary-text,var(--color-secondary-text))] border-[color:var(--color-button-secondary-border,transparent)] hover:bg-[var(--color-button-secondary-hover-bg,var(--color-secondary-600))] transition-colors",
  // Promotions only (subscribe, claim offer) — at most one per screen.
  accent:
    "bg-tertiary-500 text-[var(--color-tertiary-text)] hover:bg-tertiary-600 transition-colors",
  ghost: "text-brand-ink hover:underline transition-colors",
  danger: "bg-red-600 text-[var(--color-status-error-text,#fff)] hover:opacity-90 transition-opacity",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
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
        "btn-shape inline-flex items-center justify-center gap-2 font-body font-medium",
        variant !== "ghost" && "border-[length:var(--shape-border-width,1px)] border-transparent",
        "disabled:cursor-not-allowed disabled:bg-[var(--color-button-disabled-bg,var(--color-surface-100))] disabled:text-[var(--color-button-disabled-text,var(--color-text-muted))] disabled:border-transparent",
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
