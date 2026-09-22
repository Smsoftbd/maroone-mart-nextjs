import { PackageCheck, Truck, CreditCard, Headphones } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";

/** Trust bar under the banner (page.trust_bar; colors section.trust_bar_*). */
export async function FeatureHighlights() {
  const t = await getServerT();
  const items = [
    { icon: PackageCheck, label: t("feature_easy_exchange", "Easy exchange guarantee") },
    { icon: Truck, label: t("feature_cash_on_delivery", "Nationwide cash on home delivery") },
    { icon: CreditCard, label: t("feature_secure_payment", "Secure & easy payment") },
    { icon: Headphones, label: t("feature_support", "Fast, round-the-clock customer support") },
  ];

  return (
    // Phones: one side-scrolling row on a grey band; wider screens: a boxed grid.
    <section className="trust-section mt-6 md:mx-auto md:max-w-7xl md:px-6 md:pt-6 md:pb-4 lg:px-8" data-reveal>
      <ul className="trust-bar flex overflow-x-auto scrollbar-none py-4 md:grid md:grid-cols-2 md:gap-y-5 md:overflow-visible md:px-4 md:py-5 lg:grid-cols-4 lg:px-8 lg:py-6">
        {items.map(({ icon: Icon, label }, i) => (
          <li
            key={label}
            className={`flex w-[62%] shrink-0 items-center gap-3 px-6 md:w-auto md:px-2 lg:justify-center lg:px-6 ${i > 0 ? "max-md:border-l max-md:border-[var(--color-border-dark)] lg:border-l lg:border-[var(--color-border)]" : ""}`}
          >
            <Icon className="h-10 w-10 shrink-0 md:h-8 md:w-8 lg:h-9 lg:w-9" strokeWidth={1.25} />
            <span className="text-[15px] font-semibold leading-snug text-[var(--color-text-primary)] md:text-sm">{label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
