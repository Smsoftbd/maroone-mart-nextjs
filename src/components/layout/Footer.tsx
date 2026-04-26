import Link from "next/link";
import Image from "next/image";
import type { Store, PageSummary } from "@/lib/api/types";

interface FooterProps {
  store: Store;
  pages?: PageSummary[];
}

export function Footer({ store, pages = [] }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            {store.footer_logo ? (
              <Image
                src={store.footer_logo}
                alt={store.name}
                width={120}
                height={40}
                className="h-8 w-auto object-contain brightness-0 invert mb-4"
              />
            ) : (
              <span className="font-display text-xl font-bold text-brand-400 block mb-4">
                {store.name}
              </span>
            )}
            <p className="text-sm text-white/60 leading-relaxed mb-4">
              {store.tagline}
            </p>
            <div className="flex gap-3">
              {store.social.facebook && (
                <a
                  href={store.social.facebook}
                  className="text-white/50 hover:text-brand-400 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
              )}
              {store.social.instagram && (
                <a
                  href={store.social.instagram}
                  className="text-white/50 hover:text-brand-400 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              )}
              {store.social.youtube && (
                <a
                  href={store.social.youtube}
                  className="text-white/50 hover:text-brand-400 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.4 19.54C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
                  </svg>
                </a>
              )}
              {store.social.whatsapp && (
                <a
                  href={store.social.whatsapp}
                  className="text-white/50 hover:text-brand-400 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.531 5.845L.057 23.476a.5.5 0 0 0 .62.61l5.807-1.523A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 0 1-4.964-1.349l-.356-.212-3.644.956.972-3.553-.232-.365A9.798 9.798 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
                  </svg>
                </a>
              )}
              {store.social.tiktok && (
                <a
                  href={store.social.tiktok}
                  className="text-white/50 hover:text-brand-400 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.95a8.27 8.27 0 0 0 4.84 1.55V7.07a4.85 4.85 0 0 1-1.07-.38z" />
                  </svg>
                </a>
              )}
              {store.social.pinterest && (
                <a
                  href={store.social.pinterest}
                  className="text-white/50 hover:text-brand-400 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Pinterest"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-display font-semibold mb-4">Shop</h3>
            <ul className="space-y-2">
              <li><Link href="/products" className="text-sm text-white/60 hover:text-brand-400 transition-colors">All Products</Link></li>
              <li><Link href="/products?featured=1" className="text-sm text-white/60 hover:text-brand-400 transition-colors">Featured</Link></li>
              <li><Link href="/products?sort=new" className="text-sm text-white/60 hover:text-brand-400 transition-colors">New Arrivals</Link></li>
              <li><Link href="/search" className="text-sm text-white/60 hover:text-brand-400 transition-colors">Search</Link></li>
              {store.features.blog && (
                <li><Link href="/blog" className="text-sm text-white/60 hover:text-brand-400 transition-colors">Blog</Link></li>
              )}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-display font-semibold mb-4">Account</h3>
            <ul className="space-y-2">
              <li><Link href="/account" className="text-sm text-white/60 hover:text-brand-400 transition-colors">Dashboard</Link></li>
              <li><Link href="/account/orders" className="text-sm text-white/60 hover:text-brand-400 transition-colors">Orders</Link></li>
              {store.features.wishlist && (
                <li><Link href="/account/wishlist" className="text-sm text-white/60 hover:text-brand-400 transition-colors">Wishlist</Link></li>
              )}
              {store.features.loyalty && (
                <li><Link href="/account/loyalty" className="text-sm text-white/60 hover:text-brand-400 transition-colors">Loyalty Points</Link></li>
              )}
              <li><Link href="/track-order" className="text-sm text-white/60 hover:text-brand-400 transition-colors">Track Order</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-display font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={`tel:${store.phone}`}
                  className="text-sm text-white/60 hover:text-brand-400 transition-colors"
                >
                  {store.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${store.email}`}
                  className="text-sm text-white/60 hover:text-brand-400 transition-colors"
                >
                  {store.email}
                </a>
              </li>
              <li className="text-sm text-white/60">{store.address}</li>
              <li><Link href="/contact" className="text-sm text-white/60 hover:text-brand-400 transition-colors">Contact Us</Link></li>
              <li><Link href="/support" className="text-sm text-white/60 hover:text-brand-400 transition-colors">Support</Link></li>
            </ul>
            {pages.length > 0 && (
              <div className="mt-4 space-y-2">
                {pages.map((page) => (
                  <Link
                    key={page.id}
                    href={`/pages/${page.slug}`}
                    className="block text-sm text-white/60 hover:text-brand-400 transition-colors"
                  >
                    {page.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 text-center text-sm text-white/40">
          &copy; {year} {store.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
