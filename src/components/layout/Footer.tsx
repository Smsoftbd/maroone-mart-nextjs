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
            {store.logo ? (
              <Image
                src={store.logo}
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
