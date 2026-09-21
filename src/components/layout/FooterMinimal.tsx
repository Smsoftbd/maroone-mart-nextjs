import Link from "next/link";
import Image from "next/image";
import type { Store, PageSummary } from "@/lib/api/types";
import { ScrollToTop } from "./ScrollToTop";
import { socialIcons } from "./social-icons";
import { getServerT } from "@/lib/i18n/server";

interface FooterMinimalProps {
  store: Store;
  pages?: PageSummary[];
}

const linkClass =
  "text-neutral-500 hover:text-neutral-900 transition-colors";

const headingClass =
  "mb-5 text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-900";

/**
 * Editorial, light-ground footer used on the homepage only.
 * The brand-ground `Footer` stays in place for every other route.
 */
export async function FooterMinimal({ store, pages = [] }: FooterMinimalProps) {
  const t = await getServerT();
  const year = new Date().getFullYear();
  const socials = Object.entries(store.social).filter(
    ([key, url]) => url && socialIcons[key],
  );

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-white text-neutral-900">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
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
                  className="h-auto max-h-10 w-auto object-contain"
                />
              ) : (
                <span className="font-display text-lg uppercase tracking-[0.28em]">
                  {store.name}
                </span>
              )}
            </Link>

            {store.tagline && (
              <p className="mb-6 max-w-xs text-sm leading-relaxed text-neutral-500">
                {store.tagline}
              </p>
            )}

            <ul className="space-y-2 text-sm text-neutral-500">
              {store.address && <li className="leading-relaxed">{store.address}</li>}
              {store.phone && (
                <li>
                  <a href={`tel:${store.phone}`} className={linkClass}>
                    {store.phone}
                  </a>
                </li>
              )}
              {store.email && (
                <li>
                  <a href={`mailto:${store.email}`} className={`${linkClass} break-all`}>
                    {store.email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h6 className={headingClass}>{t("customer_service", "Customer Service")}</h6>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/contact" className={linkClass}>{t("contact", "Contact")}</Link></li>
              <li><Link href="/support" className={linkClass}>{t("support", "Support")}</Link></li>
              <li><Link href="/track-order" className={linkClass}>{t("track_order", "Track Order")}</Link></li>
              {store.features.blog && (
                <li><Link href="/blog" className={linkClass}>{t("blog", "Blog")}</Link></li>
              )}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h6 className={headingClass}>{t("company", "Company")}</h6>
            <ul className="space-y-2.5 text-sm">
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
                  <li><Link href="/account/orders" className={linkClass}>{t("orders", "Orders")}</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h6 className={headingClass}>{t("follow_us", "Follow Us")}</h6>
            {socials.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {socials.map(([key, url]) => (
                  <a
                    key={key}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={key}
                    className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 text-neutral-500 transition-colors hover:border-neutral-900 hover:text-neutral-900"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      {socialIcons[key]}
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center gap-2 border-t border-neutral-200 pt-6 text-[10px] uppercase tracking-[0.18em] text-neutral-400 sm:flex-row sm:justify-between">
          <span>
            &copy; {year} {store.name}
          </span>
          <span>{t("all_rights_reserved_by", "All Rights Reserved By")} {store.name}</span>
        </div>
      </div>

      <ScrollToTop />
    </footer>
  );
}
