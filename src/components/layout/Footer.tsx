import Link from "next/link";
import Image from "next/image";
import type { ReactElement } from "react";
import type { Store, PageSummary } from "@/lib/api/types";
import { ScrollToTop } from "./ScrollToTop";
import { getServerT } from "@/lib/i18n/server";

interface FooterProps {
  store: Store;
  pages?: PageSummary[];
}

const socialIcons: Record<string, ReactElement> = {
  facebook: (
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  ),
  instagram: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2" />
    </>
  ),
  youtube: (
    <>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.4 19.54C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" />
    </>
  ),
  tiktok: (
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.95a8.27 8.27 0 0 0 4.84 1.55V7.07a4.85 4.85 0 0 1-1.07-.38z" />
  ),
  whatsapp: (
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.531 5.845L.057 23.476a.5.5 0 0 0 .62.61l5.807-1.523A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 0 1-4.964-1.349l-.356-.212-3.644.956.972-3.553-.232-.365A9.798 9.798 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
  ),
  pinterest: (
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  ),
};

export async function Footer({ store, pages = [] }: FooterProps) {
  const t = await getServerT();
  const year = new Date().getFullYear();
  const socials = Object.entries(store.social).filter(
    ([key, url]) => url && socialIcons[key],
  );

  return (
    <footer className="bg-brand-500 text-[var(--color-primary-text)] mt-auto">
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
            <ul className="space-y-3 text-sm font-light text-[var(--color-primary-text)]/80">
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
                  <a href={`tel:${store.phone}`} className="hover:text-[var(--color-primary-text)]">
                    {store.phone}
                  </a>
                </li>
              )}
              {store.email && (
                <li className="flex items-center gap-2">
                  <svg viewBox="0 0 512 512" height="16" width="16" fill="currentColor" className="shrink-0">
                    <path d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z" />
                  </svg>
                  <a href={`mailto:${store.email}`} className="hover:text-[var(--color-primary-text)] break-all">
                    {store.email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h6 className="mb-4 font-display font-bold uppercase">{t("customer_service", "Customer Service")}</h6>
            <ul className="space-y-2 text-sm font-light">
              <li><Link href="/contact" className="text-[var(--color-primary-text)]/70 hover:text-[var(--color-primary-text)] transition-colors">{t("contact", "Contact")}</Link></li>
              <li><Link href="/support" className="text-[var(--color-primary-text)]/70 hover:text-[var(--color-primary-text)] transition-colors">{t("support", "Support")}</Link></li>
              <li><Link href="/track-order" className="text-[var(--color-primary-text)]/70 hover:text-[var(--color-primary-text)] transition-colors">{t("track_order", "Track Order")}</Link></li>
              {store.features.blog && (
                <li><Link href="/blog" className="text-[var(--color-primary-text)]/70 hover:text-[var(--color-primary-text)] transition-colors">{t("blog", "Blog")}</Link></li>
              )}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h6 className="mb-4 font-display font-bold uppercase">{t("company", "Company")}</h6>
            <ul className="space-y-2 text-sm font-light">
              {pages.length > 0 ? (
                pages.map((page) => (
                  <li key={page.id}>
                    <Link href={`/pages/${page.slug}`} className="text-[var(--color-primary-text)]/70 hover:text-[var(--color-primary-text)] transition-colors">
                      {page.title}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link href="/products" className="text-[var(--color-primary-text)]/70 hover:text-[var(--color-primary-text)] transition-colors">{t("all_products", "All Products")}</Link></li>
                  <li><Link href="/account" className="text-[var(--color-primary-text)]/70 hover:text-[var(--color-primary-text)] transition-colors">{t("my_account", "My Account")}</Link></li>
                  <li><Link href="/account/orders" className="text-[var(--color-primary-text)]/70 hover:text-[var(--color-primary-text)] transition-colors">{t("orders", "Orders")}</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h6 className="mb-4 font-display font-bold uppercase">{t("follow_us", "Follow Us")}</h6>
            {store.tagline && (
              <p className="text-sm font-light text-[var(--color-primary-text)]/70 mb-4 leading-relaxed">
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
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary-text)]/10 text-[var(--color-primary-text)]/80 transition-colors hover:bg-[var(--color-primary-text)]/20 hover:text-[var(--color-primary-text)]"
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

        <div className="border-t border-[var(--color-primary-text)]/15 mt-10 pt-6 text-center text-sm font-light text-[var(--color-primary-text)]/60">
          &copy; {year}, All Rights Reserved By{" "}
          <Link href="/" className="hover:text-[var(--color-primary-text)]">
            {store.name}
          </Link>
        </div>
      </div>

      <ScrollToTop />
    </footer>
  );
}
