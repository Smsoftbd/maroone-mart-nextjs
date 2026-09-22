import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-form-label,var(--color-text-primary))]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "input-shape w-full border-[color:var(--color-form-input-border,var(--color-border))] bg-[var(--color-form-input-bg,var(--color-surface))] px-4 py-2.5",
            "text-sm text-[var(--color-form-input-text,var(--color-text-primary))] placeholder:text-[var(--color-form-placeholder,var(--color-text-muted))]",
            "focus:outline-none focus:border-[color:var(--color-form-input-focus,var(--color-brand-500))] focus:ring-3 focus:ring-[var(--color-misc-focus-ring,var(--color-brand-100))]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {helper && !error && (
          <p className="text-xs text-[var(--color-text-muted)]">{helper}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
