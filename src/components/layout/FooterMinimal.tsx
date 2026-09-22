import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail } from "lucide-react";
import type { Store, PageSummary, PaymentMethod } from "@/lib/api/types";
import { ScrollToTop } from "./ScrollToTop";
import { socialIcons } from "./social-icons";
import { getServerT } from "@/lib/i18n/server";
import { getPaymentMethods } from "@/lib/api/content";
import { resolveL10n } from "@/lib/utils/l10n";
import { ConsentSettingsLink } from "@/components/analytics/ConsentSettingsLink";
import { getConsentBannerMode } from "@/lib/analytics/consent-server";

interface FooterMinimalProps {
  store: Store;
  pages?: PageSummary[];
}

const linkClass = "text-slate-200 hover:text-white transition-colors";

const headingClass = "mb-5 text-sm font-semibold text-cyan-400";

/** Brand tint per network for the footer's social row. */
const socialColors: Record<string, string> = {
  facebook: "text-[#1877F2]",
  youtube: "text-[#FF0000]",
  whatsapp: "text-[#25D366]",
  instagram: "text-[#E4405F]",
  tiktok: "text-white",
  pinterest: "text-[#E60023]",
};

/**
 * Dark footer used on the homepage only.
 * The brand-ground `Footer` stays in place for every other route.
 */
export async function FooterMinimal({ store, pages = [] }: FooterMinimalProps) {
  const t = await getServerT();
  const year = new Date().getFullYear();
  const socials = Object.entries(store.social).filter(
    ([key, url]) => url && socialIcons[key],
  );
  const paymentMethods: PaymentMethod[] = await getPaymentMethods().catch(() => []);
  const phones = store.phone.split(/[,/]/).map((p) => p.trim()).filter(Boolean);

  return (
    <footer className="mt-auto bg-[#0f172a] text-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-4 lg:gap-12">
          {/* Business info */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="mb-6 inline-block">
              {store.footer_logo ? (
                <Image
                  src={store.footer_logo}
                  alt={store.name}
                  width={200}
                  height={48}
                  className="h-auto max-h-12 w-auto object-contain"
                />
              ) : (
                <span className="text-2xl font-bold text-white">{store.name}</span>
              )}
            </Link>

            <ul className="space-y-3 text-sm">
              {store.address && (
                <li className="flex items-start gap-3 leading-relaxed">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 fill-red-500 text-[#0f172a]" />
                  {store.address}
                </li>
              )}
              {phones.length > 0 && (
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 fill-white text-white" />
                  <span className="flex flex-wrap gap-x-3">
                    {phones.map((p) => (
                      <a key={p} href={`tel:${p.replace(/\s+/g, "")}`} className={linkClass}>
                        {p}
                      </a>
                    ))}
                  </span>
                </li>
              )}
              {store.email && (
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a href={`mailto:${store.email}`} className={`${linkClass} break-all`}>
                    {store.email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h6 className={headingClass}>{t("company", "Company")}</h6>
            <ul className="space-y-3 text-sm">
              {pages.length > 0 ? (
                pages.map((page) => (
                  <li key={page.id}>
                    <Link href={`/pages/${page.slug}`} className={linkClass}>
                      {page.title}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link href="/products" className={linkClass}>{t("all_products", "All Products")}</Link></li>
                  <li><Link href="/account" className={linkClass}>{t("my_account", "My Account")}</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h6 className={headingClass}>{t("help", "Help")}</h6>
            <ul className="space-y-3 text-sm">
              <li><Link href="/contact" className={linkClass}>{t("contact_us", "Contact Us")}</Link></li>
              <li><Link href="/track-order" className={linkClass}>{t("track_order", "Track Order")}</Link></li>
              {store.features.blog && (
                <li><Link href="/blog" className={linkClass}>{t("blog", "Blog")}</Link></li>
              )}
            </ul>
          </div>

          {/* Social + payments */}
          <div className="col-span-2 space-y-8 lg:col-span-1 lg:pt-10">
            {socials.length > 0 && (
              <div>
                <h6 className="mb-3 text-sm font-medium text-white">{t("social_links", "Social Links")}</h6>
                <div className="flex flex-wrap items-center gap-4">
                  {socials.map(([key, url]) => (
                    <a
                      key={key}
                      href={url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={key}
                      className={`transition-opacity hover:opacity-75 ${socialColors[key] ?? "text-white"}`}
                    >
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        {socialIcons[key]}
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {paymentMethods.length > 0 && (
              <div>
                <h6 className="mb-3 text-sm font-medium text-white">{t("payment_methods", "Payment Methods")}</h6>
                <div className="flex flex-wrap items-center gap-3">
                  {paymentMethods.map((m) => {
                    const name = resolveL10n(m.name);
                    return m.icon && !m.icon.includes("no_image") ? (
                      <Image
                        key={m.id}
                        src={m.icon}
                        alt={name}
                        title={name}
                        width={56}
                        height={28}
                        className="h-7 w-auto rounded bg-white/5 object-contain"
                      />
                    ) : (
                      <span key={m.id} className="rounded bg-white/10 px-2 py-1 text-xs text-slate-200">
                        {name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 px-4 py-5 text-xs text-slate-400 sm:flex-row sm:gap-6 sm:px-6 lg:px-8">
          <span>
            &copy; {year} {store.name} — {t("all_rights_reserved", "All rights reserved")}.
          </span>
          {getConsentBannerMode() !== "off" && (
            <ConsentSettingsLink
              label={t("cookie_settings", "Cookie settings")}
              className="hover:text-white"
            />
          )}
        </div>
      </div>

      <ScrollToTop />
    </footer>
  );
}
