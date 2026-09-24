import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  label: React.ReactNode;
  /** Optional trailing text, e.g. a count. */
  meta?: React.ReactNode;
  /** Optional color swatch (e.g. for a Color attribute value). */
  swatch?: string | null;
  className?: string;
}

export function Checkbox({ checked, onChange, label, meta, swatch, className }: CheckboxProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-2.5 py-1.5 cursor-pointer select-none group",
        className
      )}
    >
      <span
        className={cn(
          "relative flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors group-has-[:focus-visible]:ring-2 group-has-[:focus-visible]:ring-[var(--color-text-primary)] group-has-[:focus-visible]:ring-offset-2",
          checked
            ? "bg-[var(--color-text-primary)] border-[var(--color-text-primary)] text-[var(--color-surface-0)]"
            : "border-[var(--color-border-dark)] group-hover:border-[var(--color-text-primary)] bg-transparent"
        )}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        {checked && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
      </span>
      {swatch && (
        <span
          className="h-3.5 w-3.5 shrink-0 rounded-full border border-[var(--color-border)]"
          style={{ backgroundColor: swatch }}
        />
      )}
      <span
        className={cn(
          "flex-1 text-sm transition-colors",
          checked
            ? "text-[var(--color-text-primary)] font-medium"
            : "text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]"
        )}
      >
        {label}
      </span>
      {meta != null && (
        <span className="text-xs text-[var(--color-text-muted)]">{meta}</span>
      )}
    </label>
  );
}
