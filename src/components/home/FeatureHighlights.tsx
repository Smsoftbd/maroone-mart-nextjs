import { PackageCheck, Truck, CreditCard, Headphones } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";

export async function FeatureHighlights() {
  const t = await getServerT();
  const items = [
    { icon: PackageCheck, label: t("feature_easy_exchange", "Easy exchange guarantee") },
    { icon: Truck, label: t("feature_cash_on_delivery", "Nationwide cash on home delivery") },
    { icon: CreditCard, label: t("feature_secure_payment", "Secure & easy payment") },
    { icon: Headphones, label: t("feature_support", "Fast, round-the-clock customer support") },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
      <ul className="grid grid-cols-2 gap-y-5 rounded-2xl border border-slate-200 bg-white px-4 py-5 lg:grid-cols-4 lg:rounded-full lg:px-8 lg:py-6">
        {items.map(({ icon: Icon, label }, i) => (
          <li
            key={label}
            className={`flex items-center gap-3 px-2 lg:justify-center lg:px-6 ${i > 0 ? "lg:border-l lg:border-slate-200" : ""}`}
          >
            <Icon className="h-8 w-8 shrink-0 text-slate-700 lg:h-9 lg:w-9" strokeWidth={1.25} />
            <span className="text-xs font-semibold leading-snug text-slate-900 sm:text-sm">{label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
