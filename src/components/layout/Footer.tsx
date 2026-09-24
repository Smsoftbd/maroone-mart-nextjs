import Link from "next/link";
import Image from "next/image";
import type { Category, Store, PageSummary, PaymentMethod } from "@/lib/api/types";
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
  categories?: Category[];
}

const linkClass = "footer-link transition-colors";
const headingClass = "footer-heading";
/**
 * Site footer, like the reference storefront: four columns (About,
 * Information, Popular categories, Info), a bar with the newsletter field and
 * social icons, then the centered copyright and payment logos.
 * page.footer_style = minimal keeps only the bottom block.
 */
export async function Footer({ store, pages = [], categories = [] }: FooterProps) {
  const t = await getServerT();
  const { page } = store.theme;
  const style = page.footer_style;
  const year = new Date().getFullYear();
  const socials = Object.entries(store.social).filter(([key, url]) => url && socialIcons[key]);
  const paymentMethods: PaymentMethod[] = page.payment_icons
    ? await getPaymentMethods().catch(() => [])
    : [];
  const phones = store.phone.split(/[,/]/).map((p) => p.trim()).filter(Boolean);

  // Information: the owner's CMS pages (FAQs, policies …), falling back to
  // the account routes.
  const helpLinks =
    pages.length > 0
      ? pages.map((p) => ({ href: `/pages/${p.slug}`, label: p.title }))
      : [
          { href: "/track-order", label: t("track_order", "Track Order") },
          { href: "/account", label: t("my_account", "My Account") },
        ];

  const socialRow = socials.length > 0 && (
    <div className="pf-footer-social flex flex-wrap items-center">
      {socials.map(([key, url]) => (
        <a
          key={key}
          href={url as string}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={key}
          className="footer-social"
        >
          <svg className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24">
            {socialIcons[key]}
          </svg>
        </a>
      ))}
    </div>
  );

  const newsletter = page.footer_newsletter && (
    <FooterNewsletter
      label={t("newsletter_signup", "Sign up for our Newsletter")}
      placeholder={t("your_email_address", "Your email address")}
      button={t("subscribe", "Subscribe")}
      success={t("newsletter_success", "Thank you for subscribing!")}
    />
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

  const about = [
    { href: "/", label: t("home", "Home") },
    { href: "/products", label: t("shop", "Shop") },
    ...(store.features.blog ? [{ href: "/blog", label: t("blogs", "Blogs") }] : []),
    { href: "/contact", label: t("contact_us", "Contact Us") },
  ];
  const popular = categories
    .filter((c) => c.slug !== "uncategorized")
    .slice(0, 5)
    .map((c) => ({ href: `/products?category=${c.slug}`, label: c.name }));

  const column = (title: string, links: { href: string; label: string }[]) => (
    <div>
      <h6 className={headingClass}>{title}</h6>
      <ul className="pf-footer-links">
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

  const info = (
    <div>
      <h6 className={headingClass}>{t("info", "Info")}</h6>
      <div className="pf-footer-info">
        {store.address && <p className="whitespace-pre-line">{store.address}</p>}
        {(phones.length > 0 || store.email) && (
          <p>
            {phones.length > 0 && (
              <>
                {t("call_us_at", "Call us at")}:{" "}
                {phones.map((p, i) => (
                  <span key={p}>
                    {i > 0 && ", "}
                    <a href={`tel:${p.replace(/\s+/g, "")}`} className={linkClass}>
                      {p}
                    </a>
                  </span>
                ))}
                <br />
              </>
            )}
            {store.email && (
              <>
                {t("email", "Email")}:{" "}
                <a href={`mailto:${store.email}`} className={`${linkClass} break-all`}>
                  {store.email}
                </a>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <footer className="site-footer pf-footer mt-auto">
      {style !== "minimal" && (
        <div className="max-w-7xl mx-auto">
          <div className="pf-footer-cols">
            {column(t("about", "About"), about)}
            {column(t("information", "Information"), helpLinks)}
            {popular.length > 0 && column(t("popular_categories", "Popular Categories"), popular)}
            {info}
          </div>

          <div className="pf-footer-bar">
            {newsletter && <div className="pf-footer-newsletter">{newsletter}</div>}
            {socialRow}
          </div>
        </div>
      )}

      <div className="pf-footer-bottom">
        <p>
          &copy; {year} {store.name.toUpperCase()}. {t("all_rights_reserved", "All Rights Reserved")}.
        </p>
        {getConsentBannerMode() !== "off" && (
          <ConsentSettingsLink label={t("cookie_settings", "Cookie settings")} className={linkClass} />
        )}
        {style === "minimal" && <div className="mt-3 flex justify-center">{socialRow}</div>}
        {payments && <div className="pf-footer-payments">{payments}</div>}
      </div>
    </footer>
  );
}
