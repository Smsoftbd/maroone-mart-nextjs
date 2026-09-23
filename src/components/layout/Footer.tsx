import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, ChevronDown } from "lucide-react";
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
const headingClass = "footer-heading";
/** Brand colors for the phone footer's social row. */
const SOCIAL_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  youtube: "#FF0000",
  whatsapp: "#25D366",
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  instagram: "#E4405F",
  tiktok: "#FFFFFF",
  pinterest: "#E60023",
};

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

  // Quick links: the storefront's own routes. Customer service: the owner's
  // CMS pages (FAQs, policies …), falling back to the account routes.
  const companyLinks = [
    { href: "/", label: t("home", "Home") },
    { href: "/products", label: t("shop", "Shop") },
    ...(store.features.blog ? [{ href: "/blog", label: t("blog", "Blog") }] : []),
    { href: "/contact", label: t("contact_us", "Contact Us") },
  ];
  const helpLinks =
    pages.length > 0
      ? pages.map((p) => ({ href: `/pages/${p.slug}`, label: p.title }))
      : [
          { href: "/track-order", label: t("track_order", "Track Order") },
          { href: "/account", label: t("my_account", "My Account") },
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
    <div className="flex flex-wrap items-center gap-3">
      {socials.map(([key, url]) => (
        <a
          key={key}
          href={url as string}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={key}
          className="footer-social"
        >
          <svg className="h-[17px] w-[17px]" fill="currentColor" viewBox="0 0 24 24">
            {socialIcons[key]}
          </svg>
        </a>
      ))}
    </div>
  );

  const newsletter = page.footer_newsletter && (
    <FooterNewsletter
      label={t("newsletter_footer_caption", "Subscribe to get the latest offers and new products.")}
      placeholder={t("email_placeholder", "your@email.com")}
      button={t("subscribe", "Subscribe")}
      success={t("newsletter_success", "Thank you for subscribing!")}
    />
  );


  const payments = paymentMethods.length > 0 && (
    <div className="flex flex-wrap items-center gap-2" aria-label={t("payment_methods", "Payment Methods")}>
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
            className="h-[30px] w-auto rounded bg-white object-contain px-1 py-0.5"
          />
        ) : (
          <span key={m.id} className="rounded bg-[color-mix(in_srgb,currentColor_12%,transparent)] px-2 py-1">
            {name}
          </span>
        );
      })}
    </div>
  );

  const contactList = (
    <ul className="space-y-3.5 text-[15px] md:text-sm [&_svg]:text-[var(--color-brand-500)]">
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
      {store.address && (
        <li className="flex items-start gap-3 leading-relaxed">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          {store.address}
        </li>
      )}
    </ul>
  );

  const accordion = (title: string, links: { href: string; label: string }[]) => (
    <details className="footer-accordion group">
      <summary className="flex cursor-pointer list-none items-center justify-between py-2 text-[15px] font-medium text-[var(--color-brand-secondary,var(--color-secondary-500))] [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-5 w-5 text-[var(--color-footer-text)] opacity-70 transition-transform group-open:rotate-180" />
      </summary>
      <ul className="space-y-2.5 pb-3 pt-1 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={linkClass}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );

  /** Phones: contact, collapsible link groups, brand-colored socials, payments. */
  const mobileFooter = (
    <div className="space-y-5 px-4 pb-6 pt-6 md:hidden">
      {logo}
      {contactList}
      <div>
        {accordion(t("company", "Company"), companyLinks)}
        {accordion(t("help", "Help"), helpLinks)}
      </div>
      {socials.length > 0 && (
        <div>
          <h6 className="mb-3 text-[15px] font-medium">{t("social_links", "Social Links")}</h6>
          <div className="flex flex-wrap items-center gap-5">
            {socials.map(([key, url]) => (
              <a
                key={key}
                href={url as string}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={key}
                style={{ color: SOCIAL_COLORS[key] }}
                className="transition-opacity hover:opacity-75"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  {socialIcons[key]}
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}
      {payments && (
        <div>
          <h6 className="mb-3 text-[15px] font-medium">{t("payment_methods", "Payment Methods")}</h6>
          {payments}
        </div>
      )}
      {newsletter}
    </div>
  );

  return (
    <footer className="site-footer mt-auto max-md:rounded-t-2xl">
      {style !== "minimal" && mobileFooter}
      {style === "columns" && (
        <div className="mx-auto hidden max-w-7xl py-12 md:block lg:py-14">
          <div className="grid grid-cols-2 gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:gap-12">
            <div className="col-span-2 space-y-6 lg:col-span-1">
              {logo}
              {store.tagline && (
                <p className="max-w-xs text-[15px] leading-relaxed">{store.tagline}</p>
              )}
              {socialRow}
            </div>

            <div>
              <h6 className={headingClass}>{t("quick_links", "Quick Links")}</h6>
              <ul className="space-y-3">
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
              <h6 className={headingClass}>{t("customer_service", "Customer Service")}</h6>
              <ul className="space-y-3">
                {helpLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={linkClass}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 space-y-5 lg:col-span-1">
              <h6 className={headingClass}>{t("contact_us", "Contact Us")}</h6>
              {contactList}
              {newsletter}
            </div>
          </div>
        </div>
      )}

      {style === "centered" && (
        <div className="mx-auto hidden max-w-3xl md:flex flex-col items-center gap-6 px-4 py-12 text-center sm:px-6">
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
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 py-5 text-xs sm:flex-row">
          <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>
              &copy; {year} {store.name}. {t("all_rights_reserved", "All rights reserved")}.
            </span>
            {getConsentBannerMode() !== "off" && (
              <ConsentSettingsLink label={t("cookie_settings", "Cookie settings")} className={linkClass} />
            )}
          </span>
          <span className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
            {style === "minimal" && socialRow}
            {helpLinks.slice(-2).map((l) => (
              <Link key={l.href} href={l.href} className={linkClass}>
                {l.label}
              </Link>
            ))}
          </span>
        </div>
      </div>

      {paymentMethods.length > 0 && (
        <div className="footer-accept hidden md:block">
          <div className="mx-auto max-w-7xl">
            <h6>{t("we_accept", "We accept")}</h6>
            <div className="flex flex-wrap items-center justify-center gap-2.5">{payments}</div>
          </div>
        </div>
      )}

    </footer>
  );
}
