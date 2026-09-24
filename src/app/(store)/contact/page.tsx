import type { Metadata } from "next";
import { MapPin, Phone, Mail, MessageCircle, Clock, ChevronRight } from "lucide-react";
import { ContactForm } from "@/components/contact/ContactForm";
import { socialIcons } from "@/components/layout/social-icons";
import { getStore } from "@/lib/api/store";
import { getServerT } from "@/lib/i18n/server";
import { messengerUrl } from "@/lib/utils/chat";

export const metadata: Metadata = {
  title: "Contact Us",
};

const brandTile = "checkout-tile bg-[color-mix(in_srgb,var(--color-brand-500)_12%,transparent)] text-[var(--color-brand-500)]";

export default async function ContactPage() {
  const [store, t] = await Promise.all([getStore(), getServerT()]);
  // Same splitting as the footer: the store may list several numbers in one field.
  const phones = store.phone.split(/[,/]/).map((p) => p.trim()).filter(Boolean);
  const chatUrl = messengerUrl(store.social.facebook, store.social.whatsapp);
  const socials = Object.entries(store.social).filter(([key, url]) => url && socialIcons[key]);

  // Tap-to-act rows for the side card and the hero shortcuts.
  const methods = [
    ...phones.map((p) => ({
      key: `tel-${p}`,
      icon: Phone,
      label: t("call_us", "Call us"),
      value: p,
      href: `tel:${p.replace(/\s+/g, "")}`,
    })),
    ...(store.email
      ? [{
          key: "email",
          icon: Mail,
          label: t("email_us", "Email us"),
          value: store.email,
          href: `mailto:${store.email}`,
        }]
      : []),
    ...(chatUrl
      ? [{
          key: "chat",
          icon: MessageCircle,
          label: t("chat_with_us", "Chat with us"),
          value: store.social.facebook ? "Messenger" : "WhatsApp",
          href: chatUrl,
        }]
      : []),
  ];
  const hasSide = methods.length > 0 || !!store.address || socials.length > 0;

  return (
    <div className="contact-page">
      <div className="checkout-hero">
        <div className="max-w-7xl mx-auto py-10 lg:py-14">
          <span className="checkout-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
            {t("get_in_touch", "Get in touch")}
          </span>
          <h1 className="mt-4 font-display text-[34px] font-bold leading-tight text-white sm:text-[44px]">
            {t("contact_us", "Contact Us")}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#94a3b8] sm:text-base">
            {t("contact_subtitle", "Questions about an order, a product or delivery? Send us a message and we'll get back to you soon.")}
          </p>
          {methods.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2.5">
              {methods.slice(0, 3).map((m) => (
                <a
                  key={m.key}
                  href={m.href}
                  {...(m.key === "chat" && { target: "_blank", rel: "noopener noreferrer" })}
                  className="contact-chip"
                >
                  <m.icon className="h-4 w-4" strokeWidth={1.75} />
                  {m.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 md:py-12">
        <div className={hasSide ? "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]" : "mx-auto max-w-2xl"}>
          <section className="checkout-card">
            <div className="checkout-card-head">
              <span className={brandTile}>
                <Mail className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <h2>{t("send_us_message", "Send us a message")}</h2>
                <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                  {t("contact_form_hint", "Fields marked * are required.")}
                </p>
              </div>
            </div>
            <ContactForm />
          </section>

          {hasSide && (
            <aside className="space-y-5 lg:sticky lg:top-24">
              {(methods.length > 0 || store.address) && (
                <section className="checkout-card !p-6">
                  <h2 className="mb-4 text-base font-semibold">{t("contact_info", "Contact information")}</h2>
                  <ul className="space-y-2.5">
                    {methods.map((m) => (
                      <li key={m.key}>
                        <a
                          href={m.href}
                          {...(m.key === "chat" && { target: "_blank", rel: "noopener noreferrer" })}
                          className="contact-method group"
                        >
                          <span className={brandTile}>
                            <m.icon className="h-5 w-5" strokeWidth={1.75} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-medium text-[var(--color-text-secondary)]">{m.label}</span>
                            <span className="block truncate font-semibold">{m.value}</span>
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-0.5" />
                        </a>
                      </li>
                    ))}
                    {store.address && (
                      <li className="contact-method !cursor-default">
                        <span className={brandTile}>
                          <MapPin className="h-5 w-5" strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-medium text-[var(--color-text-secondary)]">{t("address", "Address")}</span>
                          <span className="block text-sm leading-relaxed">{store.address}</span>
                        </span>
                      </li>
                    )}
                  </ul>
                  {methods.length > 0 && (
                    <p className="mt-4 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {t("contact_email_hint", "We respond within 24 hours")}
                    </p>
                  )}
                </section>
              )}

              {socials.length > 0 && (
                <section className="checkout-card !p-6">
                  <h2 className="mb-4 text-base font-semibold">{t("follow_us", "Follow us")}</h2>
                  <div className="flex flex-wrap gap-2.5">
                    {socials.map(([key, url]) => (
                      <a
                        key={key}
                        href={url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={key}
                        className="contact-social"
                      >
                        <svg className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24">
                          {socialIcons[key]}
                        </svg>
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
