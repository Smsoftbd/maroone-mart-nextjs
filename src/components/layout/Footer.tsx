import Link from "next/link";
import Image from "next/image";
import type { Store, PageSummary } from "@/lib/api/types";
import { ScrollToTop } from "./ScrollToTop";
import { socialIcons } from "./social-icons";
import { getServerT } from "@/lib/i18n/server";
import { ConsentSettingsLink } from "@/components/analytics/ConsentSettingsLink";
import { getConsentBannerMode } from "@/lib/analytics/consent-server";

interface FooterProps {
  store: Store;
  pages?: PageSummary[];
}

export async function Footer({ store, pages = [] }: FooterProps) {
  const t = await getServerT();
  const year = new Date().getFullYear();
  const socials = Object.entries(store.social).filter(
    ([key, url]) => url && socialIcons[key],
  );

  return (
    <footer className="mt-auto bg-footer text-[var(--color-footer-text)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Business info */}
          <div>
            <Link href="/" className="inline-block mb-4">
              {store.footer_logo ? (
                <Image
                  src={store.footer_logo}
                  alt={store.name}
                  width={200}
                  height={48}
                  className="h-auto max-h-12 w-auto object-contain"
                />
              ) : (
                <span className="font-display text-xl font-bold">{store.name}</span>
              )}
            </Link>
            <ul className="space-y-3 text-sm font-light">
              {store.address && (
                <li className="flex items-start gap-2">
                  <svg viewBox="0 0 384 512" height="16" width="16" fill="currentColor" className="mt-0.5 shrink-0">
                    <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z" />
                  </svg>
                  <span className="leading-snug">{store.address}</span>
                </li>
              )}
              {store.phone && (
                <li className="flex items-center gap-2">
                  <svg viewBox="0 0 16 16" height="16" width="16" fill="currentColor" className="shrink-0">
                    <path fillRule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z" />
                  </svg>
                  <a href={`tel:${store.phone}`} className="hover:text-[var(--color-footer-link-hover,var(--color-footer-text))]">
                    {store.phone}
                  </a>
                </li>
              )}
              {store.email && (
                <li className="flex items-center gap-2">
                  <svg viewBox="0 0 512 512" height="16" width="16" fill="currentColor" className="shrink-0">
                    <path d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z" />
                  </svg>
                  <a href={`mailto:${store.email}`} className="hover:text-[var(--color-footer-link-hover,var(--color-footer-text))] break-all">
                    {store.email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h6 className="mb-4 font-display font-bold uppercase text-[var(--color-footer-heading,var(--color-footer-text))]">{t("customer_service", "Customer Service")}</h6>
            <ul className="space-y-2 text-sm font-light">
              <li><Link href="/contact" className="text-[var(--color-footer-link,var(--color-footer-text))] hover:text-[var(--color-footer-link-hover,var(--color-footer-text))] transition-colors">{t("contact", "Contact")}</Link></li>
              <li><Link href="/support" className="text-[var(--color-footer-link,var(--color-footer-text))] hover:text-[var(--color-footer-link-hover,var(--color-footer-text))] transition-colors">{t("support", "Support")}</Link></li>
              <li><Link href="/track-order" className="text-[var(--color-footer-link,var(--color-footer-text))] hover:text-[var(--color-footer-link-hover,var(--color-footer-text))] transition-colors">{t("track_order", "Track Order")}</Link></li>
              {store.features.blog && (
                <li><Link href="/blog" className="text-[var(--color-footer-link,var(--color-footer-text))] hover:text-[var(--color-footer-link-hover,var(--color-footer-text))] transition-colors">{t("blog", "Blog")}</Link></li>
              )}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h6 className="mb-4 font-display font-bold uppercase text-[var(--color-footer-heading,var(--color-footer-text))]">{t("company", "Company")}</h6>
            <ul className="space-y-2 text-sm font-light">
              {pages.length > 0 ? (
                pages.map((page) => (
                  <li key={page.id}>
                    <Link href={`/pages/${page.slug}`} className="text-[var(--color-footer-link,var(--color-footer-text))] hover:text-[var(--color-footer-link-hover,var(--color-footer-text))] transition-colors">
                      {page.title}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link href="/products" className="text-[var(--color-footer-link,var(--color-footer-text))] hover:text-[var(--color-footer-link-hover,var(--color-footer-text))] transition-colors">{t("all_products", "All Products")}</Link></li>
                  <li><Link href="/account" className="text-[var(--color-footer-link,var(--color-footer-text))] hover:text-[var(--color-footer-link-hover,var(--color-footer-text))] transition-colors">{t("my_account", "My Account")}</Link></li>
                  <li><Link href="/account/orders" className="text-[var(--color-footer-link,var(--color-footer-text))] hover:text-[var(--color-footer-link-hover,var(--color-footer-text))] transition-colors">{t("orders", "Orders")}</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h6 className="mb-4 font-display font-bold uppercase text-[var(--color-footer-heading,var(--color-footer-text))]">{t("follow_us", "Follow Us")}</h6>
            {store.tagline && (
              <p className="text-sm font-light mb-4 leading-relaxed">
                {store.tagline}
              </p>
            )}
            {socials.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {socials.map(([key, url]) => (
                  <a
                    key={key}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={key}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-footer-text)]/10 text-[var(--color-footer-social-icon,var(--color-footer-text))] transition-colors hover:bg-[var(--color-footer-text)]/20"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      {socialIcons[key]}
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-[color:var(--color-footer-divider,rgba(255,255,255,0.15))] bg-[var(--color-footer-bottom-bg,var(--color-footer))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm font-light text-[var(--color-footer-bottom-text,var(--color-footer-text))]">
          &copy; {year}, {t("all_rights_reserved_by", "All Rights Reserved By")}{" "}
          <Link href="/" className="hover:text-[var(--color-footer-link-hover,var(--color-footer-text))]">
            {store.name}
          </Link>
          {getConsentBannerMode() !== "off" && (
            <>
              {" · "}
              <ConsentSettingsLink
                label={t("cookie_settings", "Cookie settings")}
                className="hover:text-[var(--color-footer-link-hover,var(--color-footer-text))]"
              />
            </>
          )}
        </div>
      </div>

      <ScrollToTop />
    </footer>
  );
}
