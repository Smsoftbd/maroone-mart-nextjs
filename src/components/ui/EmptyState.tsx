import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-4",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 p-4 rounded-full bg-surface-100">
          <Icon className="h-8 w-8 text-[var(--color-text-muted)]" />
        </div>
      )}
      <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant="primary"
          onClick={action.onClick}
          {...(action.href ? { as: "a", href: action.href } : {})}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
