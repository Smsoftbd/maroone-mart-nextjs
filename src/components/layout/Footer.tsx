import Link from "next/link";
import Image from "next/image";
import type { Category, Store, PageSummary, PaymentMethod } from "@/lib/api/types";
import { socialIcons } from "./social-icons";
import { Mail, MapPin, Phone } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";
import { getPaymentMethods } from "@/lib/api/content";
import { resolveL10n } from "@/lib/utils/l10n";
import { ConsentSettingsLink } from "@/components/analytics/ConsentSettingsLink";
import { getConsentBannerMode } from "@/lib/analytics/consent-server";

interface FooterProps {
  store: Store;
  pages?: PageSummary[];
  categories?: Category[];
}

const linkClass = "footer-link transition-colors";
const headingClass = "footer-heading";

/**
 * Site footer, like the Marooned storefront: on the maroon ground, the logo
 * with address, phones and email; "Customer service" and "Company" link
 * columns; "Follow us" with the networks in their brand colors; then a thin
 * rule over the centered copyright. page.footer_style = minimal keeps only
 * the copyright line.
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
  const footerLogo = store.footer_logo || store.logo;

  const customerService = [
    { href: "/contact", label: t("contact", "Contact") },
    { href: "/track-order", label: t("track_order", "Track Order") },
    ...(store.features.blog ? [{ href: "/blog", label: t("blogs", "Blogs") }] : []),
    ...(store.auth_mode !== "guest_only" ? [{ href: "/account", label: t("my_account", "My Account") }] : []),
  ];
  // Company: the owner's CMS pages (About, policies, outlets …).
  const company = pages.map((p) => ({ href: `/pages/${p.slug}`, label: p.title }));

  const socialRow = socials.length > 0 && (
    <div className="mr-footer-social">
      {socials.map(([key, url]) => (
        <a
          key={key}
          href={url as string}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={key}
          data-network={key}
          className="footer-social"
        >
          <svg className="h-[22px] w-[22px]" fill="currentColor" viewBox="0 0 24 24">
            {socialIcons[key]}
          </svg>
        </a>
      ))}
    </div>
  );

  const payments = paymentMethods.length > 0 && (
    <div className="flex flex-wrap items-center justify-center gap-4" aria-label={t("payment_methods", "Payment Methods")}>
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
            className="h-6 w-auto bg-white object-contain px-0.5"
          />
        ) : (
          <span key={m.id} className="pf-pay-chip">
            {name}
          </span>
        );
      })}
    </div>
  );

  const column = (title: string, links: { href: string; label: string }[]) => (
    <div className="mr-footer-col">
      <h6 className={headingClass}>{title}</h6>
      <ul className="mr-footer-links">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={linkClass}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  const about = (
    <div>
      <Link href="/" aria-label={store.name} className="inline-block">
        {footerLogo ? (
          <Image src={footerLogo} alt={store.name} width={240} height={80} className="mr-footer-logo w-auto object-contain" />
        ) : (
          <span className="font-display text-3xl font-bold uppercase">{store.name}</span>
        )}
      </Link>
      <ul className="mr-footer-info">
        {store.address && (
          <li>
            <MapPin className="mr-footer-icon" />
            <span className="whitespace-pre-line">{store.address}</span>
          </li>
        )}
        {phones.length > 0 && (
          <li>
            <Phone className="mr-footer-icon fill-current" strokeWidth={0} />
            <span>
              {phones.map((p, i) => (
                <span key={p}>
                  {i > 0 && ","}
                  <a href={`tel:${p.replace(/\s+/g, "")}`} className={linkClass}>
                    {p}
                  </a>
                </span>
              ))}
            </span>
          </li>
        )}
        {store.email && (
          <li>
            <Mail className="mr-footer-icon" />
            <a href={`mailto:${store.email}`} className={`${linkClass} break-all`}>
              {store.email}
            </a>
          </li>
        )}
      </ul>
    </div>
  );

  return (
    <footer className="site-footer mr-footer mt-auto">
      <div className="max-w-7xl mx-auto">
        {style !== "minimal" && (
          <div className="mr-footer-cols">
            {about}
            {column(t("customer_service", "Customer Service"), customerService)}
            {company.length > 0 && column(t("company", "Company"), company)}
            {socialRow && (
              <div className="mr-footer-col">
                <h6 className={headingClass}>{t("follow_us", "Follow Us")}</h6>
                {socialRow}
              </div>
            )}
          </div>
        )}

        <div className="mr-footer-bottom">
          <p>
            &copy; {year}, {t("all_rights_reserved_by", "All Rights Reserved By")} {store.name}
          </p>
          {getConsentBannerMode() !== "off" && (
            <ConsentSettingsLink label={t("cookie_settings", "Cookie settings")} className={linkClass} />
          )}
          {payments && <div className="mt-4">{payments}</div>}
        </div>
      </div>
    </footer>
  );
}
