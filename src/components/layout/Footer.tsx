import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail } from "lucide-react";
import type { Store, PageSummary, PaymentMethod } from "@/lib/api/types";
import { socialIcons } from "./social-icons";
import { FooterNewsletter } from "./FooterNewsletter";
import { getServerT } from "@/lib/i18n/server";
import { getPaymentMethods } from "@/lib/api/content";
import { resolveL10n } from "@/lib/utils/l10n";
import { ConsentSettingsLink } from "@/components/analytics/ConsentSettingsLink";
import { getConsentBannerMode } from "@/lib/analytics/consent-server";

interface FooterProps {
  store: Store;
  pages?: PageSummary[];
}

const linkClass = "footer-link transition-colors";
const headingClass = "mb-5 text-sm font-semibold text-[var(--color-footer-heading,var(--color-footer-text))]";

/**
 * Site footer, driven by page.footer_style:
 * - columns:  logo + contact, link columns, social
 * - centered: one centered column with a single row of links
 * - minimal:  bottom bar only
 * page.footer_newsletter adds an email box under the logo; page.payment_icons
 * shows payment logos in the bottom bar.
 */
export async function Footer({ store, pages = [] }: FooterProps) {
  const t = await getServerT();
  const { page } = store.theme;
  const style = page.footer_style;
  const year = new Date().getFullYear();
  const socials = Object.entries(store.social).filter(([key, url]) => url && socialIcons[key]);
  const paymentMethods: PaymentMethod[] = page.payment_icons
    ? await getPaymentMethods().catch(() => [])
    : [];
  const phones = store.phone.split(/[,/]/).map((p) => p.trim()).filter(Boolean);

  const companyLinks =
    pages.length > 0
      ? pages.map((p) => ({ href: `/pages/${p.slug}`, label: p.title }))
      : [
          { href: "/products", label: t("all_products", "All Products") },
          { href: "/account", label: t("my_account", "My Account") },
        ];
  const helpLinks = [
    { href: "/contact", label: t("contact_us", "Contact Us") },
    { href: "/track-order", label: t("track_order", "Track Order") },
    ...(store.features.blog ? [{ href: "/blog", label: t("blog", "Blog") }] : []),
  ];

  const logo = (
    <Link href="/" className="inline-block">
      {store.footer_logo ? (
        <Image
          src={store.footer_logo}
          alt={store.name}
          width={200}
          height={48}
          className="h-auto max-h-12 w-auto object-contain"
        />
      ) : (
        <span className="font-display text-2xl font-bold">{store.name}</span>
      )}
    </Link>
  );

  const socialRow = socials.length > 0 && (
    <div className="flex flex-wrap items-center gap-4">
      {socials.map(([key, url]) => (
        <a
          key={key}
          href={url as string}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={key}
          className="text-[var(--color-footer-social-icon,var(--color-footer-text))] transition-opacity hover:opacity-75"
        >
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            {socialIcons[key]}
          </svg>
        </a>
      ))}
    </div>
  );

  const newsletter = page.footer_newsletter && (
    <FooterNewsletter
      label={t("newsletter_title", "Stay in the Loop")}
      placeholder={t("email_placeholder", "your@email.com")}
      button={t("subscribe", "Subscribe")}
      success={t("newsletter_success", "Thank you for subscribing!")}
    />
  );

  return (
    <footer className="site-footer mt-auto">
      {style === "columns" && (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid grid-cols-2 gap-10 lg:grid-cols-4 lg:gap-12">
            <div className="col-span-2 space-y-6 lg:col-span-1">
              {logo}
              <ul className="space-y-3 text-sm">
                {store.address && (
                  <li className="flex items-start gap-3 leading-relaxed">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0" />
                    {store.address}
                  </li>
                )}
                {phones.length > 0 && (
                  <li className="flex items-center gap-3">
                    <Phone className="h-4 w-4 shrink-0" />
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
              {newsletter}
            </div>

            <div>
              <h6 className={headingClass}>{t("company", "Company")}</h6>
              <ul className="space-y-3 text-sm">
                {companyLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={linkClass}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h6 className={headingClass}>{t("help", "Help")}</h6>
              <ul className="space-y-3 text-sm">
                {helpLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={linkClass}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 space-y-4 lg:col-span-1">
              <h6 className={headingClass}>{t("follow_us", "Follow Us")}</h6>
              {store.tagline && <p className="text-sm leading-relaxed">{store.tagline}</p>}
              {socialRow}
            </div>
          </div>
        </div>
      )}

      {style === "centered" && (
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-12 text-center sm:px-6">
          {logo}
          {store.tagline && <p className="max-w-xl text-sm leading-relaxed">{store.tagline}</p>}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            {[...companyLinks, ...helpLinks].map((l) => (
              <Link key={l.href} href={l.href} className={linkClass}>
                {l.label}
              </Link>
            ))}
          </nav>
          {socialRow}
          {newsletter && <div className="w-full max-w-sm">{newsletter}</div>}
        </div>
      )}

      <div className="footer-bottom">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs sm:flex-row sm:px-6 lg:px-8">
          <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>
              &copy; {year} {store.name} — {t("all_rights_reserved", "All rights reserved")}.
            </span>
            {getConsentBannerMode() !== "off" && (
              <ConsentSettingsLink label={t("cookie_settings", "Cookie settings")} className={linkClass} />
            )}
          </span>
          {style === "minimal" && socialRow}
          {paymentMethods.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2" aria-label={t("payment_methods", "Payment Methods")}>
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
                    className="h-6 w-auto rounded bg-white object-contain p-0.5"
                  />
                ) : (
                  <span key={m.id} className="rounded bg-[color-mix(in_srgb,currentColor_12%,transparent)] px-2 py-1">
                    {name}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
