"use client";

import { AccountSidebar } from "@/components/layout/AccountSidebar";
import { useT } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils/cn";

/**
 * "My Account" frame: heading + sidebar + content column.
 *
 * With `enabled={false}` the children render bare, but the element tree stays
 * the same — so a page that flips between guest and account chrome (e.g.
 * /track-order once auth resolves) keeps its state instead of remounting.
 */
export function AccountShell({
  enabled = true,
  children,
}: {
  enabled?: boolean;
  children: React.ReactNode;
}) {
  const t = useT();

  return (
    <div className={cn(enabled && "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8")}>
      {enabled && <h1 className="font-display text-2xl font-bold mb-6">{t("my_account", "My Account")}</h1>}
      <div className={cn(enabled && "flex flex-col md:flex-row gap-6")}>
        {enabled && <AccountSidebar />}
        <div className={cn(enabled && "flex-1 min-w-0")}>{children}</div>
      </div>
    </div>
  );
}
