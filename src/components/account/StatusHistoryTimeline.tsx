import {
  FileText,
  Clock,
  PauseCircle,
  ClipboardCheck,
  Settings2,
  Box,
  PackageCheck,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  PackageOpen,
} from "lucide-react";
import { useT } from "@/lib/i18n/I18nProvider";
import type { StatusHistoryItem } from "@/lib/api/types";

interface StatusConfig {
  icon: React.ElementType;
  iconClass: string;
  labelClass: string;
  lineClass: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  draft: {
    icon: FileText,
    iconClass: "text-slate-400",
    labelClass: "text-slate-500",
    lineClass: "bg-slate-200",
  },
  pending: {
    icon: Clock,
    iconClass: "text-blue-400",
    labelClass: "text-blue-600",
    lineClass: "bg-blue-200",
  },
  on_hold: {
    icon: PauseCircle,
    iconClass: "text-amber-500",
    labelClass: "text-amber-600",
    lineClass: "bg-amber-300",
  },
  confirmed: {
    icon: ClipboardCheck,
    iconClass: "text-sky-500",
    labelClass: "text-sky-700",
    lineClass: "bg-sky-300",
  },
  processing: {
    icon: Settings2,
    iconClass: "text-violet-500",
    labelClass: "text-violet-700",
    lineClass: "bg-violet-300",
  },
  packaging: {
    icon: Box,
    iconClass: "text-purple-500",
    labelClass: "text-purple-700",
    lineClass: "bg-purple-300",
  },
  ready: {
    icon: PackageCheck,
    iconClass: "text-teal-500",
    labelClass: "text-teal-700",
    lineClass: "bg-teal-300",
  },
  shipped: {
    icon: Truck,
    iconClass: "text-indigo-500",
    labelClass: "text-indigo-700",
    lineClass: "bg-indigo-300",
  },
  delivered: {
    icon: PackageOpen,
    iconClass: "text-green-500",
    labelClass: "text-green-700",
    lineClass: "bg-green-300",
  },
  completed: {
    icon: CheckCircle2,
    iconClass: "text-green-600",
    labelClass: "text-green-800",
    lineClass: "bg-green-400",
  },
  cancelled: {
    icon: XCircle,
    iconClass: "text-red-500",
    labelClass: "text-red-700",
    lineClass: "bg-red-300",
  },
  returned: {
    icon: RotateCcw,
    iconClass: "text-orange-400",
    labelClass: "text-orange-600",
    lineClass: "bg-orange-200",
  },
  refunded: {
    icon: RotateCcw,
    iconClass: "text-orange-500",
    labelClass: "text-orange-700",
    lineClass: "bg-orange-300",
  },
};

const FALLBACK_CONFIG: StatusConfig = {
  icon: Clock,
  iconClass: "text-slate-400",
  labelClass: "text-slate-600",
  lineClass: "bg-slate-200",
};

function getConfig(status: string): StatusConfig {
  return STATUS_CONFIG[status] ?? FALLBACK_CONFIG;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface Props {
  statusHistory: StatusHistoryItem[];
}

export function StatusHistoryTimeline({ statusHistory }: Props) {
  const t = useT();
  if (!statusHistory || statusHistory.length === 0) return null;

  const sorted = [...statusHistory].reverse();

  return (
    <div>
      <h3 className="font-semibold mb-4">{t("order_timeline", "Order Timeline")}</h3>
      <ol className="space-y-0">
        {sorted.map((item, i) => {
          const cfg = getConfig(item.to_status);
          const Icon = cfg.icon;
          const isLast = i === sorted.length - 1;
          const fromCfg = getConfig(item.from_status);

          return (
            <li key={item.id} className="flex gap-3">
              {/* Icon + vertical line */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
                    isLast ? "bg-surface shadow-sm ring-2 ring-offset-1 ring-current" : "bg-surface"
                  } ${cfg.iconClass}`}
                >
                  <Icon className={`h-5 w-5 ${cfg.iconClass}`} />
                </div>
                {!isLast && (
                  <div className={`w-0.5 flex-1 my-1 min-h-[20px] ${cfg.lineClass}`} />
                )}
              </div>

              {/* Content */}
              <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
                <p className="text-sm font-medium leading-tight flex items-center gap-1.5 flex-wrap">
                  <span className={`${fromCfg.labelClass} opacity-70`}>{item.from_label}</span>
                  <span className="text-[var(--color-text-muted)] text-xs">→</span>
                  <span className={`${cfg.labelClass} font-semibold`}>{item.to_label}</span>
                </p>
                <time className="text-xs text-[var(--color-text-muted)] mt-0.5 block">
                  {formatDateTime(item.changed_at)}
                </time>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
