import { getLocale } from "@/lib/i18n/locale";
import { getTranslations } from "@/lib/api/store";
import { I18nProvider } from "@/lib/i18n/I18nProvider";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const dict = await getTranslations(locale);
  return (
    <I18nProvider locale={locale} dict={dict}>
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </I18nProvider>
  );
}
